const path = require("path");
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const async = require('async');

const init = async()=> {
    const sequelize = require(path.join(process.cwd(),"src/config/lib/sequelize.js"));
    const config = require(path.join(process.cwd(),"src/config/index.js"));
    await config.initEnvVariables()
    
    const User = require(path.join(process.cwd(),"src/modules/user/user.model.js")); 
    const Profile = require(path.join(process.cwd(),"src/modules/profile/profile.model.js")); 
    const Permission = require(path.join(process.cwd(),"src/modules/permission/permission.model.js"));
    const ProfilePermission = require(path.join(process.cwd(),"src/modules/permission/profilePermission.model.js")); 
    const Service = require(path.join(process.cwd(),"src/modules/service/service.model.js")); 
    const PermissionService = require(path.join(process.cwd(),"src/modules/service/permissionService.model.js")); 
    
    
    const userSeeder = (callback) => {
        User.findOrCreate({
            where:{
                email:"saif.sakib42011@gmail.com"
            },
            defaults:{
                password:"123456"
            }
        }).then(()=>{
            callback()
        })
    }

    const profileSeeder = (callback) => {
        User.findOne({
            where:{
                email:"saif.sakib42011@gmail.com"
            }
        })
        .then((admin)=>{
            const profiles = [
                {title:"System Admin",created_by:admin.id,updated_by:admin.id},
                {title:"Site Admin",created_by:admin.id,updated_by:admin.id}
            ];
            Profile.destroy({truncate:{cascade:true}})
            .then(()=>Profile.bulkCreate(profiles,{returning:true,ignoreDuplicates:false}))
            .then(()=>callback())
        })
    }

    const userUpdateSeeder = (callback) => {
        User.findOne({
            where:{
                email:"saif.sakib42011@gmail.com"
            }
        })
        .then((admin)=>{
            Profile.findOne({
                where:{
                    title:"System Admin"
                }
            })
            .then((profile)=>{
                admin.update({profile_id:profile.id,created_by:admin.id,updated_by:admin.id})
                .then(()=>callback())
            })
        })
    }

    const permissionSeeder = (callback) => {
        User.findOne({
            where:{
                email:"saif.sakib42011@gmail.com"
            }
        })
        .then((admin)=>{
            const permissions = [
                {title:"System Admin Permission",created_by:admin.id,updated_by:admin.id},
                {title:"Site Admin Permission",created_by:admin.id,updated_by:admin.id}
            ];
            Permission.destroy({truncate:{cascade:true}})
            .then(()=>Permission.bulkCreate(permissions,{returning:true,ignoreDuplicates:false}))
            .then(()=>callback())
        })
    }

    const serviceSeeder = (callback) => {
        User.findOne({
            where:{
                email:"saif.sakib42011@gmail.com"
            }
        })
        .then((admin)=>{
            const services = [
                {title:"Manage User",slug:"manage-user",created_by:admin.id,updated_by:admin.id},
                {title:"Manage Profile",slug:"manage-profile",created_by:admin.id,updated_by:admin.id},
                {title:"Manage Permission",slug:"manage-permission",created_by:admin.id,updated_by:admin.id},
                {title:"Manage Service",slug:"manage-service",created_by:admin.id,updated_by:admin.id}
            ];
            Service.destroy({truncate:{cascade:true}})
            .then(()=>Service.bulkCreate(services,{returning:true,ignoreDuplicates:false}))
            .then(()=>callback())
        })
    }

    const profilePermissionSeeder = (callback) => {
        User.findOne({
            where:{
                email:"saif.sakib42011@gmail.com"
            }
        })
        .then((admin)=>{
            Promise.all([
                Profile.findOne({where:{title:"System Admin"}}),
                Permission.findOne({where:{title:"System Admin Permission"}})
            ])
            .then(values=>{
                [sysyemAdminProfile,sysyemAdminPermission] = values;
                const profilePermissions = [
                    {profile_id:sysyemAdminProfile.id,permission_id:sysyemAdminPermission.id,created_by:admin.id,updated_by:admin.id},
                ];
                ProfilePermission.destroy({truncate:{cascade:true}})
                .then(()=>ProfilePermission.bulkCreate(profilePermissions,{returning:true,ignoreDuplicates:false}))
                .then(()=>callback())
            })

            
        })
    }

    const permissionServiceSeeder = (callback) => {
        User.findOne({
            where:{
                email:"saif.sakib42011@gmail.com"
            }
        })
        .then((admin)=>{
            Promise.all([
                Service.findOne({where:{title:"Manage User"}}),
                Service.findOne({where:{title:"Manage Profile"}}),
                Service.findOne({where:{title:"Manage Permission"}}),
                Service.findOne({where:{title:"Manage Service"}}),
                Permission.findOne({where:{title:"System Admin Permission"}})
            ])
            .then(values=>{
                [userService,profileService,permissionService,manageService,sysyemAdminPermission] = values;
                const permissionServices = [
                    {permission_id:sysyemAdminPermission.id,service_id:userService.id,created_by:admin.id,updated_by:admin.id},
                    {permission_id:sysyemAdminPermission.id,service_id:profileService.id,created_by:admin.id,updated_by:admin.id},
                    {permission_id:sysyemAdminPermission.id,service_id:permissionService.id,created_by:admin.id,updated_by:admin.id},
                    {permission_id:sysyemAdminPermission.id,service_id:manageService.id,created_by:admin.id,updated_by:admin.id}
                ];
                PermissionService.destroy({truncate:{cascade:true}})
                .then(()=>PermissionService.bulkCreate(permissionServices,{returning:true,ignoreDuplicates:false}))
                .then(()=>callback())
            })

            
        })
    }
    
    async.waterfall([userSeeder,profileSeeder,userUpdateSeeder,permissionSeeder,serviceSeeder,profilePermissionSeeder,permissionServiceSeeder],(err)=>{
        if (err) {
            console.log("123123123123123=================================",err);
        }
        console.log('db seed complete');
        process.exit();
    })
}

init()