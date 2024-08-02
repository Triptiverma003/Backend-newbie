import mongoose from "mongoose"
import { Schema } from "mongoose"
const videoSchema = new Schema(
    {
    videoFile:{
        type:"String",
        required:true,
    },
    thumbnail:{
        type: "String",
        required:true,
    },
    description:{
        type: "String",
        required:true,
    },
    duration:{
        type:Number,
        required:true,
    },
    view:{
        type:Number,
        default:0,
    },
    isPublished:{
        type: Boolean,
        default:true
    },
    owner:{
        type:Schema.Types.ObjectId,
        ref:"User",
    },

    timestamps : true,
},
)
export const VideoModel = mongoose.Model("Video" , videoSchema);