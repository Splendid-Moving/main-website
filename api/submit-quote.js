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
            tags: ['website-lead'], // Tag for workflow trigger
            customField: {}
        };

        // Add Move Size as both tag and custom field
        if (moveSize) {
            contactData.tags.push(moveSize);
            contactData.customField.yS4Bj6LtQ3lLCuju7vl0 = moveSize; // Move size field
        }

        // Add custom fields with correct GHL field IDs
        if (addressFromFull) {
            contactData.customField.KyE8Eopo3MXg4aXjGnqS = addressFromFull; // Moving From
        }

        if (addressToFull) {
            contactData.customField.DjfpJEtJnBnDBP6nvJ1l = addressToFull; // Moving To
        }

        if (moveDate) {
            contactData.customField.VuatzebiX5qPrzGjl4d4 = moveDate; // Moving Date
        }

        if (additionalDetails) {
            contactData.customField.HZgxySrqsR4IICCBWZr5 = additionalDetails; // Additional details
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

        // Handle duplicate contact - update instead of failing
        if (!ghlResponse.ok && responseData.message?.includes('duplicated contacts')) {
            console.log('Duplicate contact detected, updating existing contact:', responseData.meta?.contactId);

            const existingContactId = responseData.meta?.contactId;

            if (!existingContactId) {
                return res.status(400).json({
                    error: 'Duplicate contact but no contact ID provided',
                    details: responseData
                });
            }

            // Update the existing contact
            const updateResponse = await fetch(`https://services.leadconnectorhq.com/contacts/${existingContactId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${GHL_ACCESS_TOKEN}`,
                    'Content-Type': 'application/json',
                    'Version': '2021-07-28'
                },
                body: JSON.stringify(contactData)
            });

            const updateData = await updateResponse.json();

            if (!updateResponse.ok) {
                console.error('Failed to update existing contact:', updateData);
                return res.status(updateResponse.status).json({
                    error: 'Failed to update existing contact',
                    details: updateData
                });
            }

            // Success - contact updated
            return res.status(200).json({
                success: true,
                message: 'Quote request updated successfully',
                contactId: existingContactId,
                updated: true
            });
        }

        // Handle other errors
        if (!ghlResponse.ok) {
            console.error('GHL API Error:', responseData);
            return res.status(ghlResponse.status).json({
                error: 'Failed to create contact in CRM',
                details: responseData
            });
        }

        // Success - new contact created
        return res.status(200).json({
            success: true,
            message: 'Quote request submitted successfully',
            contactId: responseData.contact?.id || responseData.id,
            updated: false
        });

    } catch (error) {
        console.error('Server error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            details: error.message
        });
    }
}
