const mongoose = reqire("mongoose");


const responseModel = new mongoose.Schema({
    trigger: { type: Number, required: true, unique: true },
    reply: { type: String, required: true }
})

module.exports= monogoose.model("Response", responseModel);