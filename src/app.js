import express from "express";
import cors from "cors"
import cookieParser from "cookie-parser";

const app=express()

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}))

//form/object data
//url data
//for storing static data
//for performing crud operations on users cookies
app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({ extended:true,limit:"16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

//routes import
import userRouter from './routes/user.routes.js'

//we earlier used app.get becuase earlier we had routes and controllers together
// but now they are in different files so that is why we use app.use
//routes declaration
app.use("/api/v1/users",userRouter)

export {app}