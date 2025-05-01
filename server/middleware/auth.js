import User from '../models/User.js';

const auth = async (req, res, next) => {
    try {
        const email = req.header('X-User-Email');

        // For development/testing - provide a test email if none exists
        const testEmail = 'test@example.com';

        if (!email) {
            console.log("⚠️ No authentication email provided - using test account");
            // Try to find test user
            let testUser = await User.findOne({ email: testEmail });

            // Create test user if it doesn't exist
            if (!testUser) {
                console.log("📝 Creating test user account");
                testUser = new User({
                    email: testEmail,
                    firstName: 'Test',
                    lastName: 'User',
                    targetCalories: 2000,
                    macroPercentages: { protein: 20, fat: 30, carbs: 50 }
                });
                await testUser.save();
                console.log("✅ Test user created");
            }

            req.user = testUser;
            return next();
        }

        let user = await User.findOne({ email });
        if (!user) {
            // Try to create the user if not found
            console.log(`⚠️ User not found for email: ${email} - creating new account`);
            user = new User({
                email: email,
                firstName: 'New',
                lastName: 'User',
                targetCalories: 2000,
                macroPercentages: { protein: 20, fat: 30, carbs: 50 }
            });
            await user.save();
            console.log("✅ New user created");
        }

        req.user = user;
        next();
    } catch (error) {
        console.error("❌ Auth error:", error);
        // Use test user as fallback for any errors
        try {
            const testUser = await User.findOne({ email: 'test@example.com' });
            if (testUser) {
                req.user = testUser;
                return next();
            }
        } catch (fallbackError) {
            console.error("Failed to use test user fallback:", fallbackError);
        }

        res.status(401).json({ message: 'Authentication required', error: error.message });
    }
};

export default auth; 