// Vercel Serverless Function: Submit Quote to GoHighLevel
// This function handles form submissions from the quote modal

export default async function handler(req, res) {
    // Only accept POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // CORS headers - adjust origin in production to your actual domain
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        // Extract form data from request body
        const {
            firstName,
            lastName,
            phone,
            email,
            moveSize,
            addressFromFull,
            addressToFull,
            moveDate,
            additionalDetails
        } = req.body;

        // Validate required fields
        if (!firstName || !lastName || !phone || !email) {
            return res.status(400).json({
                error: 'Missing required fields',
                details: 'firstName, lastName, phone, and email are required'
            });
        }

        // Get GHL credentials from environment variables
        const GHL_ACCESS_TOKEN = process.env.GHL_ACCESS_TOKEN;
        const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID;

        if (!GHL_ACCESS_TOKEN || !GHL_LOCATION_ID) {
            console.error('Missing GHL environment variables');
            return res.status(500).json({
                error: 'Server configuration error',
                details: 'Missing API credentials'
            });
        }

        // Prepare contact data for GoHighLevel API
        const contactData = {
            firstName,
            lastName,
            name: `${firstName} ${lastName}`,
            phone,
            email,
            locationId: GHL_LOCATION_ID,
            source: 'Website Quote Form',
            tags: moveSize ? [moveSize] : [],
            customFields: []
        };

        // Add custom fields for addresses and move details
        if (addressFromFull) {
            contactData.customFields.push({
                key: 'pickup_address',
                value: addressFromFull
            });
        }

        if (addressToFull) {
            contactData.customFields.push({
                key: 'dropoff_address',
                value: addressToFull
            });
        }

        if (moveDate) {
            contactData.customFields.push({
                key: 'preferred_move_date',
                value: moveDate
            });
        }

        if (additionalDetails) {
            contactData.customFields.push({
                key: 'additional_notes',
                value: additionalDetails
            });
        }

        // Make API request to GoHighLevel
        const ghlResponse = await fetch('https://services.leadconnectorhq.com/contacts/', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GHL_ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
                'Version': '2021-07-28' // GHL API version
            },
            body: JSON.stringify(contactData)
        });

        const responseData = await ghlResponse.json();

        if (!ghlResponse.ok) {
            console.error('GHL API Error:', responseData);
            return res.status(ghlResponse.status).json({
                error: 'Failed to create contact in CRM',
                details: responseData
            });
        }

        // Success response
        return res.status(200).json({
            success: true,
            message: 'Quote request submitted successfully',
            contactId: responseData.contact?.id || responseData.id
        });

    } catch (error) {
        console.error('Server error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            details: error.message
        });
    }
}
