import mongoose from 'mongoose';
import { BookFair } from '../../src/models/BookFair';
import { MongoMemoryServer } from 'mongodb-memory-server';

describe('BookFair Model', () => {
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await BookFair.deleteMany({});
  });

  describe('BookFair Creation', () => {
    it('should create a valid book fair', async () => {
      const validBookFair = {
        name: 'Spring Book Fair 2024',
        description: 'A wonderful book fair for spring',
        startDate: new Date('2024-05-01'),
        endDate: new Date('2024-05-03'),
        location: 'City Convention Center',
        organizer: new mongoose.Types.ObjectId(),
        maxExhibitors: 50,
        registrationFee: 100.00
      };

      const bookFair = new BookFair(validBookFair);
      const savedBookFair = await bookFair.save();

      expect(savedBookFair._id).toBeDefined();
      expect(savedBookFair.name).toBe(validBookFair.name);
      expect(savedBookFair.description).toBe(validBookFair.description);
      expect(savedBookFair.status).toBe('planning');
      expect(savedBookFair.features.length).toBe(0);
    });

    it('should require mandatory fields', async () => {
      const invalidBookFair = new BookFair({});

      try {
        await invalidBookFair.save();
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.errors).toBeDefined();
        expect(error.errors.name).toBeDefined();
        expect(error.errors.description).toBeDefined();
        expect(error.errors.startDate).toBeDefined();
        expect(error.errors.endDate).toBeDefined();
        expect(error.errors.location).toBeDefined();
        expect(error.errors.organizer).toBeDefined();
      }
    });

    it('should validate end date is after start date', async () => {
      const invalidBookFair = new BookFair({
        name: 'Invalid Fair',
        description: 'Invalid dates',
        startDate: new Date('2024-05-03'),
        endDate: new Date('2024-05-01'), // Before start date
        location: 'Test Location',
        organizer: new mongoose.Types.ObjectId()
      });

      try {
        await invalidBookFair.save();
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.errors).toBeDefined();
        expect(error.errors.endDate).toBeDefined();
      }
    });

    it('should validate registration dates', async () => {
      const invalidBookFair = new BookFair({
        name: 'Test Fair',
        description: 'Test description',
        startDate: new Date('2024-05-01'),
        endDate: new Date('2024-05-03'),
        location: 'Test Location',
        organizer: new mongoose.Types.ObjectId(),
        registrationStart: new Date('2024-05-02'),
        registrationEnd: new Date('2024-05-01') // Before registration start
      });

      try {
        await invalidBookFair.save();
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.errors).toBeDefined();
        expect(error.errors.registrationEnd).toBeDefined();
      }
    });
  });

  describe('BookFair Methods', () => {
    let bookFair: any;

    beforeEach(async () => {
      bookFair = new BookFair({
        name: 'Test Fair',
        description: 'Test description',
        startDate: new Date('2024-05-01'),
        endDate: new Date('2024-05-03'),
        location: 'Test Location',
        organizer: new mongoose.Types.ObjectId(),
        registrationStart: new Date('2024-04-01'),
        registrationEnd: new Date('2024-04-30'),
        status: 'planning'
      });
      await bookFair.save();
    });

    it('should calculate duration correctly', () => {
      const duration = bookFair.durationDays;
      expect(duration).toBe(3); // May 1-3 = 3 days
    });

    it('should check if registration is open', () => {
      // Mock current date to be within registration period
      const originalDate = Date;
      global.Date = jest.fn(() => new Date('2024-04-15')) as any;
      global.Date.now = originalDate.now;

      bookFair.status = 'registration';
      const isOpen = bookFair.isRegistrationOpen();
      expect(isOpen).toBe(true);

      // Restore original Date
      global.Date = originalDate;
    });

    it('should check if fair can be modified', () => {
      expect(bookFair.canModify()).toBe(true);

      bookFair.status = 'active';
      expect(bookFair.canModify()).toBe(false);

      bookFair.status = 'completed';
      expect(bookFair.canModify()).toBe(false);
    });

    it('should check if fair is currently active', () => {
      // Mock current date to be during the fair
      const originalDate = Date;
      global.Date = jest.fn(() => new Date('2024-05-02')) as any;
      global.Date.now = originalDate.now;

      bookFair.status = 'active';
      const isActive = bookFair.isCurrentlyActive();
      expect(isActive).toBe(true);

      // Restore original Date
      global.Date = originalDate;
    });

    it('should add feature correctly', async () => {
      await bookFair.addFeature('mobile_app');
      expect(bookFair.features).toContain('mobile_app');
    });

    it('should not add duplicate features', async () => {
      await bookFair.addFeature('mobile_app');
      await bookFair.addFeature('mobile_app');
      
      const mobileAppCount = bookFair.features.filter((f: string) => f === 'mobile_app').length;
      expect(mobileAppCount).toBe(1);
    });

    it('should update status correctly', async () => {
      await bookFair.updateStatus('registration');
      expect(bookFair.status).toBe('registration');
    });
  });

  describe('BookFair Queries', () => {
    beforeEach(async () => {
      // Create sample book fairs
      const fairs = [
        {
          name: 'Spring Fair',
          description: 'Spring event',
          startDate: new Date('2024-05-01'),
          endDate: new Date('2024-05-03'),
          location: 'Location A',
          organizer: new mongoose.Types.ObjectId(),
          status: 'planning'
        },
        {
          name: 'Summer Fair',
          description: 'Summer event',
          startDate: new Date('2024-08-01'),
          endDate: new Date('2024-08-03'),
          location: 'Location B',
          organizer: new mongoose.Types.ObjectId(),
          status: 'active'
        }
      ];

      await BookFair.insertMany(fairs);
    });

    it('should find active book fairs', async () => {
      const activeFairs = await BookFair.find({ status: 'active' });
      expect(activeFairs.length).toBe(1);
      expect(activeFairs[0].name).toBe('Summer Fair');
    });

    it('should find book fairs by date range', async () => {
      const summerFairs = await BookFair.find({
        startDate: { $gte: new Date('2024-07-01') }
      });
      expect(summerFairs.length).toBe(1);
      expect(summerFairs[0].name).toBe('Summer Fair');
    });

    it('should sort book fairs by start date', async () => {
      const sortedFairs = await BookFair.find({}).sort({ startDate: 1 });
      expect(sortedFairs[0].name).toBe('Spring Fair');
      expect(sortedFairs[1].name).toBe('Summer Fair');
    });
  });
});
