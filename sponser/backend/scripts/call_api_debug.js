const http = require('http');

const options = {
    hostname: 'localhost',
    port: 3005,
    path: '/api/admin/sponsor-report',
    method: 'GET'
};

const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const parsed = JSON.parse(data);
            console.log('=== API Response Debug Info ===');
            if (parsed.debug) {
                console.log(JSON.stringify(parsed.debug, null, 2));

                // Also print the report entry for Kaushik
                if (parsed.report) {
                    const kaushik = parsed.report.find(r => r.email.toLowerCase().includes('dask'));
                    if (kaushik) {
                        console.log('\nReport Entry for Kaushik:');
                        console.log(kaushik);
                    } else {
                        console.log('\nKaushik NOT found in report array.');
                    }
                }
            } else {
                console.log('No debug info found in response. Is the server updated?');
                console.log('Response keys:', Object.keys(parsed));
            }
        } catch (e) {
            console.error('Error parsing JSON:', e.message);
            console.log('Raw data snippet:', data.substring(0, 100));
        }
    });
});

req.on('error', (error) => {
    console.error('Error calling API:', error.message);
});

req.end();
