import {asyncHandler} from '../utils/asyncHandler.js';
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/users.model.js";
import {uploadCloudinary} from "../utils/fileUpload.js";
import { ApiResponse } from '../utils/ApiResponse.js';

const registerUser = asyncHandler( async(req , res) => {
    // get user detail from frontend
    //validation-not empty
    //check if user already exist: (username , email),
    //upload them to cloudinary , avatar.
    //create user object-create entry in DB
    // remove password and refresh token field from response,
    //check for user creation
    //check res
    const{fullname , email , username , password}=req.body
    console.log("email" , email);

    if(
        [fullname , email, username, password].some((field)=>
        field?.trim() === "")
    ){
        throw new ApiError(400 , "All fields are required")
    }

    if(fullname === ""){
        throw new ApiError(400 , "fullname is required")
    }
    const existedUser = User.findOne({
        $or: [{username} , {email}]
    })
    if(existedUser){
        throw new ApiError(409, "user with username already exist")

    }
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverimagepath = req.files?.coverImage[0]?.path;

    if(!avatarLocalPath){
        throw new ApiError(400 , "Avatar file is required");
    }
    const avatar = await uploadCloudinary(avatarLocalPath)
    const coverImage = await uploadCloudinary(coverimagepath)

    if(!avatar){
        throw new ApiError(400 , "Avatar file is required");
    }
    User.create ({
        fullname,
        avatar : avatar.url,
        coverImage: coverImage.url || "",
        email,
        password,
        username : username.toLowerCase()
    })
    const createduser = await User.findById(User._id).select(
        "-password -refreshToken "
    )
    if(!createduser){
        throw new ApiError(500 , "something went wrong while registering user")
    }
    return res.status(201).json(
        new ApiResponse(200 , createduser , "User registered Successfully")
    )
} )

export {registerUser};