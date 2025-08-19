import { Request, Response } from "express";
import { Exhibitor } from "../models/Exhibitor";
import { BookFair } from "../models/BookFair";
import { FairEvent } from "../models/FairEvent";

interface AuthenticatedRequest extends Request {
  user?: {
    _id: string;
    email: string;
    isAdmin: boolean;
  };
}

// Exhibitor Registration and Management
export const registerExhibitor = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { bookFairId } = req.params;
    
    // Check if book fair exists and is accepting registrations
    const bookFair = await BookFair.findById(bookFairId);
    if (!bookFair) {
      return res.status(404).json({ error: "Book fair not found" });
    }

    if (!bookFair.isRegistrationOpen()) {
      return res.status(400).json({ error: "Registration is not currently open" });
    }

    // Check for existing registration
    const existingExhibitor = await Exhibitor.findOne({
      bookFairId,
      userId: req.user._id
    });

    if (existingExhibitor) {
      return res.status(400).json({ error: "Already registered for this book fair" });
    }

    // Create new exhibitor registration
    const exhibitorData = {
      ...req.body,
      bookFairId,
      userId: req.user._id,
      applicationDate: new Date(),
      paymentAmount: getBoothPrice(req.body.boothSize || 'small')
    };

    const exhibitor = new Exhibitor(exhibitorData);
    await exhibitor.save();

    // Populate for response
    await exhibitor.populate('userId', 'email name');
    await exhibitor.populate('bookFairId', 'name startDate endDate');

    res.status(201).json({
      success: true,
      exhibitor,
      message: "Exhibitor registration submitted successfully"
    });
  } catch (error) {
    console.error("Error registering exhibitor:", error);
    res.status(500).json({
      error: "Failed to register exhibitor",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

export const getExhibitorsByFair = async (req: Request, res: Response) => {
  try {
    const { bookFairId } = req.params;
    const { status, hasSchoolBooks } = req.query;

    let query: any = { bookFairId };
    
    if (status) {
      query.status = status;
    }
    
    if (hasSchoolBooks === 'true') {
      query.hasSchoolBooks = true;
    }

    const exhibitors = await Exhibitor.find(query)
      .populate('userId', 'email name')
      .populate('bookFairId', 'name startDate endDate')
      .sort({ applicationDate: -1 });

    res.json({
      success: true,
      exhibitors,
      count: exhibitors.length
    });
  } catch (error) {
    console.error("Error fetching exhibitors:", error);
    res.status(500).json({
      error: "Failed to fetch exhibitors",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

export const getExhibitorById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const exhibitor = await Exhibitor.findById(id)
      .populate('userId', 'email name')
      .populate('bookFairId', 'name startDate endDate location');

    if (!exhibitor) {
      return res.status(404).json({ error: "Exhibitor not found" });
    }

    // Get exhibitor's events
    const events = await FairEvent.find({
      exhibitorId: id,
      status: { $ne: 'cancelled' }
    }).sort({ startTime: 1 });

    res.json({
      success: true,
      exhibitor: {
        ...exhibitor.toObject(),
        events
      }
    });
  } catch (error) {
    console.error("Error fetching exhibitor:", error);
    res.status(500).json({
      error: "Failed to fetch exhibitor",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

export const updateExhibitor = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const exhibitor = await Exhibitor.findById(id);
    if (!exhibitor) {
      return res.status(404).json({ error: "Exhibitor not found" });
    }

    // Check permissions
    if (!req.user?.isAdmin && exhibitor.userId.toString() !== req.user?._id) {
      return res.status(403).json({ error: "Unauthorized to modify this exhibitor" });
    }

    // Check if can modify
    if (!exhibitor.canModify() && !req.user?.isAdmin) {
      return res.status(400).json({ 
        error: "Cannot modify exhibitor after approval/rejection" 
      });
    }

    // Update exhibitor
    const updatedExhibitor = await Exhibitor.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).populate('userId', 'email name')
     .populate('bookFairId', 'name startDate endDate');

    res.json({
      success: true,
      exhibitor: updatedExhibitor,
      message: "Exhibitor updated successfully"
    });
  } catch (error) {
    console.error("Error updating exhibitor:", error);
    res.status(500).json({
      error: "Failed to update exhibitor",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

// Admin Actions
export const approveExhibitor = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { id } = req.params;
    const { boothNumber } = req.body;

    const exhibitor = await Exhibitor.findById(id);
    if (!exhibitor) {
      return res.status(404).json({ error: "Exhibitor not found" });
    }

    if (exhibitor.status !== 'pending') {
      return res.status(400).json({ error: "Can only approve pending applications" });
    }

    // Check booth number uniqueness if provided
    if (boothNumber) {
      const existingBooth = await Exhibitor.findOne({
        bookFairId: exhibitor.bookFairId,
        boothNumber,
        status: 'approved'
      });

      if (existingBooth) {
        return res.status(400).json({ error: "Booth number already assigned" });
      }

      exhibitor.boothNumber = boothNumber;
    }

    await exhibitor.approve(req.user._id);

    await exhibitor.populate('userId', 'email name');
    await exhibitor.populate('bookFairId', 'name startDate endDate');

    res.json({
      success: true,
      exhibitor,
      message: "Exhibitor approved successfully"
    });
  } catch (error) {
    console.error("Error approving exhibitor:", error);
    res.status(500).json({
      error: "Failed to approve exhibitor",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

export const rejectExhibitor = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ error: "Rejection reason is required" });
    }

    const exhibitor = await Exhibitor.findById(id);
    if (!exhibitor) {
      return res.status(404).json({ error: "Exhibitor not found" });
    }

    if (exhibitor.status !== 'pending') {
      return res.status(400).json({ error: "Can only reject pending applications" });
    }

    await exhibitor.reject(reason, req.user._id);

    await exhibitor.populate('userId', 'email name');
    await exhibitor.populate('bookFairId', 'name startDate endDate');

    res.json({
      success: true,
      exhibitor,
      message: "Exhibitor rejected"
    });
  } catch (error) {
    console.error("Error rejecting exhibitor:", error);
    res.status(500).json({
      error: "Failed to reject exhibitor",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

// Booth Management
export const assignBooth = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { id } = req.params;
    const { boothNumber } = req.body;

    if (!boothNumber) {
      return res.status(400).json({ error: "Booth number is required" });
    }

    const exhibitor = await Exhibitor.findById(id);
    if (!exhibitor) {
      return res.status(404).json({ error: "Exhibitor not found" });
    }

    if (exhibitor.status !== 'approved') {
      return res.status(400).json({ error: "Can only assign booths to approved exhibitors" });
    }

    // Check booth number uniqueness
    const existingBooth = await Exhibitor.findOne({
      bookFairId: exhibitor.bookFairId,
      boothNumber,
      _id: { $ne: id }
    });

    if (existingBooth) {
      return res.status(400).json({ error: "Booth number already assigned" });
    }

    exhibitor.boothNumber = boothNumber;
    await exhibitor.save();

    res.json({
      success: true,
      exhibitor,
      message: "Booth assigned successfully"
    });
  } catch (error) {
    console.error("Error assigning booth:", error);
    res.status(500).json({
      error: "Failed to assign booth",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

// Helper Functions
function getBoothPrice(boothSize: string): number {
  const prices: Record<string, number> = {
    small: 500,
    medium: 1000,
    large: 1500,
    premium: 2500
  };
  return prices[boothSize] || 500;
}
