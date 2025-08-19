import { Request, Response } from "express";
import { BookFair } from "../models/BookFair";
import { Exhibitor } from "../models/Exhibitor";
import { FairEvent } from "../models/FairEvent";
import { Participant } from "../models/Participant";

interface AuthenticatedRequest extends Request {
  user?: {
    _id: string;
    email: string;
    isAdmin: boolean;
  };
}

// Book Fair CRUD Operations
export const createBookFair = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    const bookFairData = {
      ...req.body,
      organizer: req.user._id
    };

    const bookFair = new BookFair(bookFairData);
    await bookFair.save();

    res.status(201).json({
      success: true,
      bookFair,
      message: "Book fair created successfully"
    });
  } catch (error) {
    console.error("Error creating book fair:", error);
    res.status(500).json({
      error: "Failed to create book fair",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

export const getAllBookFairs = async (req: Request, res: Response) => {
  try {
    const { status, upcoming } = req.query;
    
    let query: any = {};
    
    if (status) {
      query.status = status;
    }
    
    if (upcoming === 'true') {
      query.endDate = { $gte: new Date() };
    }

    const bookFairs = await BookFair.find(query)
      .populate('organizer', 'email name')
      .sort({ startDate: 1 });

    res.json({
      success: true,
      bookFairs,
      count: bookFairs.length
    });
  } catch (error) {
    console.error("Error fetching book fairs:", error);
    res.status(500).json({
      error: "Failed to fetch book fairs",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

export const getBookFairById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const bookFair = await BookFair.findById(id)
      .populate('organizer', 'email name');

    if (!bookFair) {
      return res.status(404).json({ error: "Book fair not found" });
    }

    // Get additional statistics
    const [exhibitorsCount, eventsCount, participantsCount] = await Promise.all([
      Exhibitor.countDocuments({ bookFairId: id, status: 'approved' }),
      FairEvent.countDocuments({ bookFairId: id, status: 'published' }),
      Participant.countDocuments({ bookFairId: id })
    ]);

    res.json({
      success: true,
      bookFair: {
        ...bookFair.toObject(),
        stats: {
          exhibitorsCount,
          eventsCount,
          participantsCount
        }
      }
    });
  } catch (error) {
    console.error("Error fetching book fair:", error);
    res.status(500).json({
      error: "Failed to fetch book fair",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

export const updateBookFair = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { id } = req.params;
    const updates = req.body;

    const bookFair = await BookFair.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).populate('organizer', 'email name');

    if (!bookFair) {
      return res.status(404).json({ error: "Book fair not found" });
    }

    res.json({
      success: true,
      bookFair,
      message: "Book fair updated successfully"
    });
  } catch (error) {
    console.error("Error updating book fair:", error);
    res.status(500).json({
      error: "Failed to update book fair",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

export const deleteBookFair = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { id } = req.params;

    const bookFair = await BookFair.findById(id);
    if (!bookFair) {
      return res.status(404).json({ error: "Book fair not found" });
    }

    // Check if fair can be deleted (only if in planning status)
    if (bookFair.status !== 'planning') {
      return res.status(400).json({ 
        error: "Cannot delete book fair that is not in planning status" 
      });
    }

    await BookFair.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Book fair deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting book fair:", error);
    res.status(500).json({
      error: "Failed to delete book fair",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

// Book Fair Status Management
export const updateBookFairStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { id } = req.params;
    const { status } = req.body;

    const bookFair = await BookFair.findById(id);
    if (!bookFair) {
      return res.status(404).json({ error: "Book fair not found" });
    }

    // Validate status transition
    const validTransitions: Record<string, string[]> = {
      'planning': ['registration', 'cancelled'],
      'registration': ['active', 'cancelled'],
      'active': ['completed', 'cancelled'],
      'completed': [],
      'cancelled': []
    };

    if (!validTransitions[bookFair.status]?.includes(status)) {
      return res.status(400).json({
        error: `Cannot transition from ${bookFair.status} to ${status}`
      });
    }

    bookFair.status = status;
    await bookFair.save();

    res.json({
      success: true,
      bookFair,
      message: `Book fair status updated to ${status}`
    });
  } catch (error) {
    console.error("Error updating book fair status:", error);
    res.status(500).json({
      error: "Failed to update book fair status",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

// Dashboard and Analytics
export const getBookFairDashboard = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { id } = req.params;

    const [bookFair, exhibitors, events, participants, recentActivity] = await Promise.all([
      BookFair.findById(id).populate('organizer', 'email name'),
      Exhibitor.find({ bookFairId: id }).populate('userId', 'email name'),
      FairEvent.find({ bookFairId: id }).populate('createdBy', 'email name'),
      Participant.find({ bookFairId: id }).populate('userId', 'email name'),
      FairEvent.find({ bookFairId: id })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('createdBy', 'email name')
    ]);

    if (!bookFair) {
      return res.status(404).json({ error: "Book fair not found" });
    }

    // Calculate statistics
    const stats = {
      total: {
        exhibitors: exhibitors.length,
        events: events.length,
        participants: participants.length
      },
      exhibitors: {
        pending: exhibitors.filter(e => e.status === 'pending').length,
        approved: exhibitors.filter(e => e.status === 'approved').length,
        rejected: exhibitors.filter(e => e.status === 'rejected').length
      },
      events: {
        draft: events.filter(e => e.status === 'draft').length,
        published: events.filter(e => e.status === 'published').length,
        cancelled: events.filter(e => e.status === 'cancelled').length
      },
      participants: {
        checkedIn: participants.filter(p => p.checkedIn).length,
        active: participants.filter(p => {
          const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          return p.lastActive > weekAgo;
        }).length
      }
    };

    res.json({
      success: true,
      dashboard: {
        bookFair,
        stats,
        recentActivity,
        canModify: bookFair.canModify()
      }
    });
  } catch (error) {
    console.error("Error fetching book fair dashboard:", error);
    res.status(500).json({
      error: "Failed to fetch dashboard data",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
};
