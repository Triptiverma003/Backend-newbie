import {asyncHandler} from '../utils/asyncHandler.js';
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/users.model.js";
import {uploadCloudinary} from "../utils/fileUpload.js";
import { ApiResponse } from '../utils/ApiResponse.js';
import jwt from "jsonwebtoken";

const generateAccessAndRefreshToken = async(userId)=>{
try{
   const user =  await User.findById(userId)
   const accessToken = user.generateAccessToken()
   const refreshToken = user.generateRefreshToken()

   user.refreshToken = refreshToken
   await user.save({validateBeforeSave : false})

   return {accessToken , refreshToken}
}
catch(error){
    throw new ApiError(500 , "something went wrong while generating tokens")
}
}

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
const loginUser = asyncHandler(async(req ,res)=>{
    //req body ->data
    //if not user then register.
    //if a user attempt for password.
    //if password is authenticated then send them the tokens is not send them its wrong password
    // send cookie

    const {email , username , password} = req.body

    if(!username && !email){
        throw new ApiError(400 , "username or email is required")
    }

    const user = await User.findOne({
        $or: [{username} , {email}]
    })

    if(!user){
        throw new ApiError(404 , "user does not exist")
    }

    const isPasswordvalid = await user.isPasswordCorrect(password)

    if(!isPasswordvalid){
        throw new ApiError(401 , "invalid credintial")
    }
    const {accessToken , refreshToken}=await generateAccessAndRefreshToken(user._id)
    
    const loggedInUser = await User.findById(user._id).select("password -refreshToken")

    const option = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken" , 
        accessToken , option
    )
    .cookie("refreshToken" , 
        refreshToken , option
    )
    .json(
        new ApiResponse (
            200,
            {
                user: loggedInUser , accessToken, refreshToken
            },
            "User logged in Successfully"
        )
    )


})
const logoutUser = asyncHandler(async(req , res) =>{

  await User.findByIdAndUpdate(
    req.user._id,
    {
        $set:{
            refreshToken: undefined
        }
    },
    {
        new: true
    }
  )
  const option = {
    httpOnly: true,
    secure: true
    }
    return res.status(200)
    .clearCookie("accessToken" , option)
    clearCookie("refreshToken" , option)
    .json(new ApiResponse(200 ,{} , "User Logged Out"))


})
const refreshAccessToken = asyncHandler(async(req , res) =>{
    const incomingRefreshToken = req.cookies.refredhToken || req.body.refreshToken
    if(!incomingRefreshToken){
        throw new ApiError(401 , "unauthorixzed access")
    }
   try {
     const decodedToken = jwt.verify(
         incomingRefreshToken,
         process.env.ACCESS_TOKEN_SECERET
     )
     const user = await User.findById(decodedToken?._id)
     if(!user){
         throw new ApiError(401 , "invalid token")
     }
     if(incomingRefreshToken!== user?.refreshToken){
         throw new ApiError(401 , "refresh token has been expired")
     }
     const options = {
         httpOnly : true,
         secure:true
     }
    const {accessToken , newRefreshToken} = await generateAccessAndRefreshToken(user._id)
     return res
     .status(200)
     .cookie("accessToken" , accessToken , options)
     .cookie("refreshToken" , newRefreshToken,options)
     .json(
         new ApiResponse(
             200,
             {accessToken , refreshToken : newRefreshToken },
             "refreshed"
         )
     )
   } catch (error) {
    throw new ApiError(401 , error?.message ||
        "invalid refresh token"
    )
   }
})
const changeCurrentPassword = asyncHandler(async(req , res) =>{
    const {oldPassword , newPassword} = req.body
    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(400 , "Invalid old password")
    }
    user.password = newPassword
    await user.save ({validateBeforeSave : false})

    return res
    .status(200)
    .json(new ApiResponse(200 , {} , "Password changed successfully"))

})
const getCurrentUser = asyncHandler(async(req ,res)=>{
    return res
    .status(200)
    .json(200 , req.user , "current user fetched successfully")
})
const updateAcountDetails = asyncHandler(async(req,res)=>{
    const {fullname , email} = req.body
    if(!fullname || !email){
        throw new ApiError(400 , "All fields are req.")
    }

    User.findByIdAndUpdate(
        req.user?._id,
        {$set :{
            fullname,
            Email :email
        }},
        {new : true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200 , "Account details updated"))
})
const UpdateUserAvatar = asyncHandler(async(req , res)=>{
    const avatarLocalpath = req.file?.path
    if(!avatarLocalpath){
        throw new ApiError(400 , "file missing")
    }
    if(!avatar.url){
        throw new ApiError(400 , "Error while uploading field")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar: avatar.url
            },
        },
            {new: true},
    ).select("-password")
    return res 
    .status(200)
    .json(
        new ApiResponse(200 , user, "update image")
    )
})
const UpdateCoverimage = asyncHandler(async(req , res)=>{
    const updatecoverimage = req.file?.path
    if(!updatecoverimage){
        throw new ApiError(400 , "image missing")
    }
    if(!updatecoverimage.url){
        throw new ApiError(400 , "Error while uploading field")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar: avatar.url
            },
        },
            {new: true},
    ).select("-password")
    return res 
    .status(200)
    .json(
        new ApiResponse(200 , user, "update image")
    )
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser
};