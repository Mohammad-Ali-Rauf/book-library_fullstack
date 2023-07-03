import express from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from './models/User.js';
import Book from './models/Book.js';
import { config } from 'dotenv';
config()

const validateToken = async (req, res, next) => {
    const token = req.header('token');

    if (!token) {
        return res.status(401).json({ error: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ error: 'Token is not valid' });
    }
}

const app = express();

app.use(express.json());

// Connect to Database
try {
    mongoose.connect(process.env.DATABASE_URI);
    console.log('Connected to MongoDB');
} catch (err) {
    config.error('Error connecting to database: ', err)
}

app.get('/', (req, res) => {
    res.send('Welcome to book manager API');
})

app.post('/register', async (req, res) => {
    const { name, email, password, createdAt } = req.body;
    
    const existingUser = await User.findOne({ email })

    if (existingUser) {
        return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const newUser = new User({
        name,
        email,
        password: hashedPassword,
        createdAt,
    });

    newUser.save()

    const token = jwt.sign({ userId: newUser._id, name: newUser.name, email: newUser.email, password: newUser.password}, process.env.JWT_SECRET)

    res.status(201).json({ msg: 'User registered successfully', newUser: newUser, token: token });

})

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    
    const existingUser = await User.findOne({ email })

    if (!existingUser) {
        return res.status(400).json({ error: 'User not found!' });
    }

    const isValidPassword = bcrypt.compareSync(password, existingUser.password);

    if(!isValidPassword) {
        return res.status(400).json({ error: 'Invalid password!' });
    }

    const token = jwt.sign({ userId: existingUser._id, name: existingUser.name, email: existingUser.email, password: existingUser.password}, process.env.JWT_SECRET)

    res.status(201).json({ msg: 'User logged in successfully', user: existingUser, token: token });

})

app.post('/books', validateToken, async (req, res) => {
    const { title, description, author, publicationDate } = req.body;
    const { userId, email } = req.user;

    try {
        // Create a new book
        const newBook = await Book.create({
            title,
            description,
            author,
            publicationDate,
            publisher: {
                id: userId,
                email
            }
        });

        res.status(201).json({ msg: 'Book created successfully', book: newBook });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create book' });
    }
});

app.get('/books', validateToken, async (req, res) => {
    try {
        const { userId } = req.user;

        const books = await Book.find({ 'publisher.id': userId });

        res.status(200).json({ books });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch books' });
    }
});

app.get('/books/:bookId', validateToken, async (req, res) => {
    try {
        const bookId = req.params.bookId;

        const book = await Book.findOne({ _id: bookId });

        res.status(200).json({ book });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch book' });
    }
})

app.patch('/books/:bookId', validateToken, async (req, res) => {
    const { bookId } = req.params;
    const { title, description, author, publicationDate } = req.body;

    try {
        // Find the book by its ID and update its properties
        const updatedBook = await Book.findByIdAndUpdate(
            bookId,
            {
                title,
                description,
                author,
                publicationDate
            },
            { new: true }
        );

        if (!updatedBook) {
            return res.status(404).json({ error: 'Book not found' });
        }

        res.status(200).json({ msg: 'Book updated successfully', book: updatedBook });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update book' });
    }
});

app.delete('/books/:bookId', validateToken, async (req, res) => {
    const { bookId } = req.params;

    try {
        // Find the book by its ID and update its properties
        const deletedBook = await Book.findByIdAndDelete(bookId);

        if (!deletedBook) {
            return res.status(404).json({ error: 'Book not found' });
        }

        res.status(200).json({ msg: 'Book deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete book' });
    }
});

const PORT = 5000 || process.env.PORT;

app.listen(PORT, () => console.log(`Server listening on ${PORT}`));