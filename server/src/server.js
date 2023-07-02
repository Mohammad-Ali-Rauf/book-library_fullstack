import express from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from './models/User.js';
import { config } from 'dotenv';
config()

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

    const token = jwt.sign({ name: newUser.name, email: newUser.email, password: newUser.password}, process.env.JWT_SECRET)

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

    const token = jwt.sign({ email: existingUser.email, password: existingUser.password}, process.env.JWT_SECRET)

    res.status(201).json({ msg: 'User logged in successfully', user: existingUser, token: token });

})

const PORT = 5000 || process.env.PORT;

app.listen(PORT, () => console.log(`Server listening on ${PORT}`));