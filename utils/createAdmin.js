const bcrypt = require("bcrypt");
const User = require("../models/User");
const Role = require("../models/Role");

const createAdmin = async () => {
    try{
    const adminRole = await Role.findOne({name: "Admin"});
    if(!adminRole) return;

    const existingAdmin = await User.findOne({email: "admin@wbc.com"});

    if(!existingAdmin){
        const hashedPassword = await bcrypt.hash("Admin@123",10);

        await User.create({
            fullName: "Super Admin",
            age:30,
            email: "admin@wbc.com",
            country: "India",
            image: "",
            password: "Admin@123",
            role: adminRole._id,
            status: "active"
        });

        console.log("Default Admin Created");
    }
    }catch(error){
        console.error("Error creating admin:",error.message)
    }
};

module.exports = createAdmin;