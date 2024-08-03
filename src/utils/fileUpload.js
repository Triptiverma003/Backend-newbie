import { v2 as cloudinary } from 'cloudinary';
import fs from "fs";
    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_NAME,
        api_key:process.env.ClOUDINARY_APIKEY,
        api_secret:process.env.CLOUDINARY_APISECRET
    });
    const uploadCloudinary =async(localFile)=>{
        try{
            if(!localFile) return null
            const response = await cloudinary.uploader.upload(localFile , {
                resource_type: "auto"
            })
            fs.unlinkSync(localFile)
            return response;
        }
        catch(error){
            fs.unlink(localFile)
            return null;
        }
    }


export {uploadCloudinary}