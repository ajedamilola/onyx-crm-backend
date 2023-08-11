const { User, leaveTypes } = require("./database");
const { sendMail } = require("./functions");
process.title = "CircuitCity-BackgroundJobs";

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
    users.forEach(user=>{
        if(user.leave && user.leave.open && !user.leave.pending && user.leave.approved){
            //so this user has a leave that is active and ongoing
            if(user.leave.expiring < today){
                //Take Action and stop the leave
                user.leave.open = false;
                user.leave.pending = true;
                user.leave.approved = false;
                user.save()
                sendMail("Circuit City CRPMS <crpms@circuitcity.com.ng>",user.email,"Leave Expiry",`
                <div style='text-align:center'> 
                Your <b>${leaveTypes[user.leave.ltype]}</b> leave Period has <b>EXPIRED</b> and you are expected to resume back to your duties<br />
                <a href='https://trixmanager.com/'><button style='padding:7px 17px;background-color:green;border-width:0px; color:white'>View Dashboard</button></a>
                </div>
                `)
            }
        }
    })
}

checkTasks()
setInterval(() => {
    //Medium Priority Background Events 2Hours
    checkTasks()
    checkLeaves()
}, 1000 * 60 * 60 * 2)
