import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import { GoogleGenAI } from "@google/genai";

dotenv.config()

const app=express()

app.use(cors())
app.use(express.json())

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const History=[]

app.post("/chat",async(req,res)=>{
    try {
    const {messages}=req.body

    messages.forEach(msg => {
  History.push({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: msg.text }]
  });
});


    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: History,
      config:{
        systemInstruction:`You are a Data structure and Algorithm Instructor. You will only reply to the problem related to 
      Data structure and Algorithm. You have to solve query of user in simplest way
      If user ask any question which is not related to Data structure and Algorithm, reply him rudely
      Example: If user ask, How are you
      You will reply: You dumb ask me some sensible question, like this message you can reply anything more rudely
      
      You have to reply him rudely if question is not related to Data structure and Algorithm.
      Else reply him politely with simple explanation
`
      }
    });

    res.json({
        reply:response.text
    })
    } catch (error) {
        console.error(error);
    res.status(500).json({
      error: "Something went wrong",
    });
    }

})

app.listen(5000, () => {
  console.log("Server running on port 5000");
});