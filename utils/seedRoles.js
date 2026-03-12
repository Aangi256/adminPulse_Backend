const Role = require("../models//Role");

const seedRoles = async () => {
    const roles = [
        {name: "Admin", permission: ["ALL"]},
        {name: "Designer", permissions:["JOB_VIEW" , "JOB_UPDATE"]},
        {name: "QC", permissions: ["JOB_VIEW","JOB_APPROVE"]},
        {name: "Production", permissions: ["JOB_VIEW"]}
    ];
    
    for (let role of roles){
        const exists = await Role.findOne({name: role.name});
        if(!exists){
            await Role.create(role);
            console.log(`${role.name} role created`);
            
        }
    }
};

module.exports = seedRoles;