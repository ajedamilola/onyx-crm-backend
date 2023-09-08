const { User, leaveTypes } = require("./database");
const { sendMail } = require("./functions");
process.title = "CircuitCity-BackgroundJobs";

function areLastTwoDatesTwoDaysApart(dateArray) {
    if (dateArray.length < 1) {
        return false; // Not enough dates to check
    }

    const currentDate = new Date();
    const recentDate = dateArray[dateArray.length - 1];
    const secondRecentDate = dateArray[dateArray.length - 2];

    // console.log(dateArray)
    // Calculate the difference in days between the recent date and the current date
    let daysApart = 0;
    daysApart = Math.floor((currentDate - recentDate) / (1000 * 60 * 60 * 24));
    return daysApart;
}

async function checkTasks() {
    const today = new Date();
    const users = await User.find();
    users.forEach(async user => {
        let consecutiveMisses = 0;
        let maxMisses = 0;
        let monthMisses = 0;
        const failed = [];
        let shudSend = false;
        //loop thorugh all thier tasks

        user.tasks.forEach(async task => {
            if (task.bySuper && !task.bySelf) {
                const dueDate = task.date;
                if (today > dueDate) {
                    //This Task is due add it to the list of task history
                    if (!user.taskHistory.some(t => t.taskId === task.id)) {
                        //add it to history if !found
                        user.taskHistory.push({ taskId: task.id, due: dueDate, completed: Boolean(task.successful), admin: task.admin })
                        if (!Boolean(task.successful)) {
                            if (today.getMonth() == dueDate.getMonth() && today.getFullYear() == dueDate.getFullYear()) {

                                monthMisses++;
                                failed.push({
                                    title: task.title,
                                    date: task.date.toDateString(),
                                    admin: (await User.findById(task.admin)).name
                                })

                            }
                            consecutiveMisses += 1;
                            if (consecutiveMisses == 3) {
                                user.taskHistory[user.taskHistory.length - 1].reported = true;
                                shudSend = true;
                            }
                            if (monthMisses == 7) {
                                shudSend = true;
                            }
                        } else {
                            maxMisses = Math.max(maxMisses, consecutiveMisses);
                            consecutiveMisses = 0;
                        }
                    }
                }
            }
        })
        setTimeout(async () => {
            if (shudSend) {
                const hr = await User.findOne({ privilage: 3 });
                const copies = await User.find({
                    $or: [
                        { privilage: 2, department: user.department },
                        {
                            privilage: {
                                $gte: 4
                            }
                        }
                    ]
                })
                const cc = copies.map(a => a.email).join(",");
                sendMail("crpms@circuitcity.com.ng", hr.email, "Task Deadline Missed", "", "failedTask", {
                    name: user.name,
                    tasks: failed
                }, cc)
                // console.log(user.email, hr.email, "Task Deadline Grace Missed", "", "failedTask", {
                //     name: user.name,
                //     tasks: failed
                // }, cc)
            }
        }, 1000)

        user.save()
    })
}

async function checkLeaves() {
    const today = new Date();
    const users = await User.find();
    users.forEach(user => {
        if (user.leave && user.leave.open && !user.leave.pending && user.leave.approved) {
            //so this user has a leave that is active and ongoing
            if (user.leave.expiring < today) {
                //Take Action and stop the leave
                user.leave.open = false;
                user.leave.pending = true;
                user.leave.approved = false;
                user.save()
                sendMail("Circuit City CRPMS <crpms@circuitcity.com.ng>", user.email, "Leave Expiry", `
                <div style='text-align:center'> 
                Your <b>${leaveTypes[user.leave.ltype]}</b> leave Period has <b>EXPIRED</b> and you are expected to resume back to your duties<br />
                <a href='https://trixmanager.com/'><button style='padding:7px 17px;background-color:green;border-width:0px; color:white'>View Dashboard</button></a>
                </div>
                `)
            }
        }
    })
}

async function checkAttendance() {
    /**
     * 
     * @param {any} user 
     * @param {Number} days 
     */
    function alert(user, days) {
        sendMail("Management System <cprms@circuitcity.com.ng>", user.email, "CPRMS Abscence",
            `
            Hi ${user.name},
            <br /><br />
            We noticed that you have missed signing in for ${days} day(s). Please make sure to sign in regularly to keep track of your attendance, task and designated duties.
            <br />
            If you have any questions or concerns, feel free to reach out to us through <a href="mailto:crpms@circuitcity.com.ng">crpms@circuitcity.com.ng</a>.
            <br />
            <br />
            Best regards,<br />
            Circuit City<br />
            For any further issues or complaint about login in or using the CRM, please reach out to the our Technical Team
                `
        )

        user.daysMissed = days;
        user.save()
    }
    const users = await User.find()
    users.forEach(user => {
        const daysMissed = areLastTwoDatesTwoDaysApart(user.checkIns);
        if (daysMissed >= 2) {
            alert(user, daysMissed)
        } else {
            user.daysMissed = 0;
            user.save(0)
        }
    })
}

checkTasks()

setInterval(() => {
    //Medium Priority Background Events 2Hours
    checkTasks()
    checkLeaves()
}, 1000 * 60 * 60 * 2)

setInterval(() => {
    //Least Priority will be sent everyday
    checkAttendance()
}, 1000 * 60 * 60 * 24)
