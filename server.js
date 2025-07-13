const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const Defect = require('./models/Defect');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3003;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'report.html'));
});

// Get all defects with filters
app.get('/api/defects', async (req, res) => {
    try {
        const { status, severity, assignee, sortBy } = req.query;
        let query = {};

        // Apply filters
        if (status) query.status = status;
        if (severity) query.severity = severity;
        if (assignee) query.assignee = { $regex: assignee, $options: 'i' };

        // Build sort object
        let sort = {};
        switch (sortBy) {
            case 'date_asc':
                sort = { createdAt: 1 };
                break;
            case 'date_desc':
                sort = { createdAt: -1 };
                break;
            case 'severity_asc':
                sort = { severity: 1 };
                break;
            case 'severity_desc':
                sort = { severity: -1 };
                break;
            default:
                sort = { createdAt: -1 };
        }

        const defects = await Defect.find(query).sort(sort);
        res.json({ success: true, defects });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create new defect
app.post('/api/defects', async (req, res) => {
    try {
        const newDefect = new Defect(req.body);
        const savedDefect = await newDefect.save();
        res.json({ success: true, defect: savedDefect });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update defect
app.put('/api/defects/:id', async (req, res) => {
    try {
        const updatedDefect = await Defect.findByIdAndUpdate(
            req.params.id,
            { ...req.body, updatedAt: Date.now() },
            { new: true }
        );
        if (!updatedDefect) {
            return res.status(404).json({ error: 'Defect not found' });
        }
        res.json({ success: true, defect: updatedDefect });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete defect
app.delete('/api/defects/:id', async (req, res) => {
    try {
        const deletedDefect = await Defect.findByIdAndDelete(req.params.id);
        if (!deletedDefect) {
            return res.status(404).json({ error: 'Defect not found' });
        }
        res.json({ success: true, message: 'Defect deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
}); 