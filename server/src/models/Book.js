import mongoose from "mongoose";

const bookSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    author: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    publicationDate: {
        type: Date,
        required: true,
        default: Date.now,
    },
    publisher: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user',
            required: true
        },
        email: {
            type: String,
            required: true
        }
    },
});

const Book = mongoose.model('book', bookSchema);

export default Book;
