import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import jwt from "jsonwebtoken";
import {user} from "../models/users.model";


export const verifyJWT = asyncHandler(async (req , res , next) =>{
  try {
     const token =  req.cookies?.accessToken || req.header
      ("Authorization")?.replace("Bearer" , "")
  
      if(!token){
          throw new ApiError(401 , "Unauthorize access")
      }
      const decodedToken = jwt.verify(token , process.env.ACCESS_TOKEN_SECERET)
      await user.findById(decodedToken?._id).select("-password -refreshToken")
  
      if(!user){
          throw new ApiError(401 , "Invalid Access Token")
      }
      req.user = user;
      next()
  } catch (error) {
    throw new ApiError (401 , error?.message ||
        "invalid access token")
  }

})