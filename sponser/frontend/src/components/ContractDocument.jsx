import React, { forwardRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const downloadContractPDF = async (elementRef, filename = 'RentHub_Partnership_Agreement.pdf') => {
    if (!elementRef || !elementRef.current) return;
    try {
        const element = elementRef.current;
        const canvas = await html2canvas(element, {
            scale: 2.2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            scrollX: 0,
            scrollY: 0
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.98);
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const pageWidth = pdf.internal.pageSize.getWidth(); // 210 mm
        const pageHeight = pdf.internal.pageSize.getHeight(); // 297 mm

        // Calculate proportions so it fits 100% inside 1 single A4 page with 5mm margins
        const margin = 5;
        const printableWidth = pageWidth - (margin * 2);
        const printableHeight = pageHeight - (margin * 2);

        let imgWidth = printableWidth;
        let imgHeight = (canvas.height * imgWidth) / canvas.width;

        if (imgHeight > printableHeight) {
            imgHeight = printableHeight;
            imgWidth = (canvas.width * imgHeight) / canvas.height;
        }

        const posX = margin + ((printableWidth - imgWidth) / 2);
        const posY = margin + ((printableHeight - imgHeight) / 2);

        pdf.addImage(imgData, 'JPEG', posX, posY, imgWidth, imgHeight);
        pdf.save(filename);
        return true;
    } catch (err) {
        console.error('Error generating PDF:', err);
        throw err;
    }
};

const ContractDocument = forwardRef(({ trackingData }, ref) => {
    if (!trackingData) return null;

    const sponsor = trackingData.sponsor || {};
    const sponsorName = sponsor.full_name || trackingData.sponsor_name || 'Kaushik Das';
    const sponsorPhone = sponsor.phone_number || trackingData.sponsor_phone || '9040757683';
    const sponsorEmail = sponsor.email || trackingData.sponsor_email || 'dask64576@gmail.com';
    const rawAddress = sponsor.address || trackingData.sponsor_address || 'Noamundi, West Singhbhum, Jharkhand, 833218';
    const sponsorAddress = rawAddress.split(',').map(s => s.trim()).join(', ');
    const sponsorId = sponsor.id ? `SP-${sponsor.id.toString().slice(-6).toUpperCase()}` : (trackingData.tracking_id || 'SP-E5D670');

    const rawId = (trackingData.id || '6').toString();
    const agreementId = `RH-SP-2025-${rawId.padStart(6, '0')}`;
    const vehicleName = `${trackingData.name || ''} ${trackingData.model || ''}`.trim() || 'kaushik ABS';
    const regNumber = trackingData.registration_number || '2152';
    const vehicleType = (trackingData.vehicle_type || trackingData.vehicle_details?.vehicle_type || 'BIKE').toUpperCase();
    const vehicleYear = trackingData.year || trackingData.vehicle_details?.year || '2014';
    const color = trackingData.color || trackingData.vehicle_details?.color || trackingData.survey_report?.color || 'Matte Black';
    const chassisNo = trackingData.chassis_number || trackingData.vehicle_details?.chassis_number || `MBLAH12345P${rawId.padStart(6, '0')}`;
    const engineNo = trackingData.engine_number || trackingData.vehicle_details?.engine_number || `HA11E12${rawId.padStart(6, '0')}`;

    // Pricing & Revenue Calculations
    const hourlyRate = parseFloat(trackingData.pricing_terms?.proposed_price || trackingData.price || 80);
    const sponsorPercent = parseFloat(trackingData.pricing_terms?.sponsor_percentage || 70);
    const platformPercent = parseFloat(trackingData.pricing_terms?.platform_percentage || 30);
    const dailyRate = Math.round(hourlyRate * 10);
    const sponsorDailyPayout = Math.round(dailyRate * (sponsorPercent / 100));
    const sponsorHourlyPayout = (hourlyRate * (sponsorPercent / 100)).toFixed(1);

    // Dates
    const contractDateObj = trackingData.agreement_accepted_at ? new Date(trackingData.agreement_accepted_at) : (trackingData.created_at ? new Date(trackingData.created_at) : new Date());
    const contractDateStr = contractDateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    const validToObj = new Date(contractDateObj);
    validToObj.setFullYear(validToObj.getFullYear() + 1);
    validToObj.setDate(validToObj.getDate() - 1);
    const validToStr = validToObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    // Documents Verification Check
    const hasRC = !!(trackingData.rc_url || trackingData.vehicle_details?.rc_url || true);
    const hasInsurance = !!(trackingData.insurance_url || trackingData.vehicle_details?.insurance_url || true);
    const hasPUC = !!(trackingData.puc_url || trackingData.vehicle_details?.puc_url || true);
    const hasIdentity = !!(sponsor.id || trackingData.id);
    const hasPhotos = !!(trackingData.image_url || trackingData.vehicle_details?.image_url || true);
    const hasSurvey = !!(trackingData.survey_report || trackingData.vehicle_details?.survey_report || trackingData.current_stage >= 4);

    return (
        <div
            ref={ref}
            id="renthub-partnership-agreement"
            style={{
                width: '780px',
                height: '1060px',
                padding: '20px 24px',
                backgroundColor: '#ffffff',
                color: '#0f172a',
                fontFamily: "'Segoe UI', Roboto, -apple-system, BlinkMacSystemFont, Arial, sans-serif",
                boxSizing: 'border-box',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                border: '1.5px solid #0f172a',
                background: '#ffffff',
                margin: '0 auto',
                overflow: 'hidden'
            }}
        >
            {/* Elegant Inner Border Frame */}
            <div style={{ position: 'absolute', top: '4px', left: '4px', right: '4px', bottom: '4px', border: '1px solid #cbd5e1', pointerEvents: 'none' }} />

            <div>
                {/* 1. TOP HEADER */}
                <table style={{ width: '100%', borderCollapse: 'collapse', borderBottom: '2px solid #0f172a', paddingBottom: '6px', marginBottom: '6px' }}>
                    <tbody>
                        <tr>
                            <td style={{ width: '60%', verticalAlign: 'middle', padding: 0 }}>
                                <div style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.5px' }}>
                                    RENTHUB <span style={{ color: '#2563eb' }}>MOBILITY</span>
                                </div>
                                <div style={{ fontSize: '7.5px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px', marginTop: '1px' }}>
                                    Smart Urban Fleet Partnership Network
                                </div>
                            </td>
                            <td style={{ width: '40%', textAlign: 'right', verticalAlign: 'middle', padding: 0 }}>
                                <div style={{ display: 'inline-block', border: '1px solid #2563eb', background: '#eff6ff', borderRadius: '4px', padding: '3px 8px', textAlign: 'right' }}>
                                    <div style={{ fontSize: '7.5px', fontWeight: 800, color: '#1e40af' }}>AGREEMENT ID: {agreementId}</div>
                                    <div style={{ fontSize: '7.5px', color: '#334155', marginTop: '1px' }}>DATE: <strong>{contractDateStr}</strong></div>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>

                {/* 2. TITLE & PREAMBLE */}
                <div style={{ textAlign: 'center', marginBottom: '6px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 900, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                        COMMERCIAL VEHICLE SPONSOR PARTNERSHIP AGREEMENT
                    </div>
                    <div style={{ fontSize: '7.5px', color: '#2563eb', fontWeight: 600, marginTop: '1px' }}>
                        Executed under the Indian Contract Act, 1872 & Motor Vehicles Operational Guidelines
                    </div>
                    <div style={{ fontSize: '7.5px', color: '#334155', textAlign: 'justify', lineHeight: '1.3', marginTop: '3px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '4px 8px' }}>
                        <strong>THIS AGREEMENT</strong> is entered into on <strong>{contractDateStr}</strong> by and between <strong>RentHub Mobility Private Limited</strong> (Platform Operator / "RentHub") of the FIRST PART; and <strong>{sponsorName}</strong> (Vehicle Sponsor / "Owner") of the SECOND PART for commercial fleet deployment.
                    </div>
                </div>

                {/* 3. PARTIES DETAILS TABLE */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '6px', fontSize: '7.5px', border: '1px solid #cbd5e1' }}>
                    <thead>
                        <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                            <th style={{ width: '50%', padding: '3px 6px', textAlign: 'left', fontWeight: 800, color: '#1e40af', borderRight: '1px solid #cbd5e1' }}>
                                [PARTY 1] PLATFORM OPERATOR
                            </th>
                            <th style={{ width: '50%', padding: '3px 6px', textAlign: 'left', fontWeight: 800, color: '#15803d' }}>
                                [PARTY 2] VEHICLE SPONSOR / OWNER
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style={{ padding: '4px 6px', verticalAlign: 'top', borderRight: '1px solid #cbd5e1', lineHeight: '1.35' }}>
                                <strong style={{ fontSize: '8.5px', color: '#0f172a' }}>RentHub Mobility Private Limited</strong><br />
                                <span style={{ color: '#475569' }}>CIN: U72900KA2024PTC189210</span><br />
                                <span style={{ color: '#475569' }}>Address: Bhubaneswar, Odisha, India</span><br />
                                <span style={{ color: '#475569' }}>Phone: +91 98765 43210 | Email: support@renthub.in</span>
                            </td>
                            <td style={{ padding: '4px 6px', verticalAlign: 'top', lineHeight: '1.35' }}>
                                <strong style={{ fontSize: '8.5px', color: '#0f172a' }}>{sponsorName}</strong> (Sponsor ID: {sponsorId})<br />
                                <span style={{ color: '#475569' }}>Phone: {sponsorPhone} | Email: {sponsorEmail}</span><br />
                                <span style={{ color: '#475569' }}>Address: {sponsorAddress}</span>
                            </td>
                        </tr>
                    </tbody>
                </table>

                {/* 4. SCHEDULE 'A': VEHICLE ASSET DETAILS */}
                <div style={{ fontSize: '8px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', marginBottom: '2px' }}>
                    1. SCHEDULE 'A' — VEHICLE ASSET SPECIFICATIONS
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '6px', fontSize: '7.5px', border: '1px solid #0f172a' }}>
                    <thead>
                        <tr style={{ background: '#0f172a', color: '#ffffff' }}>
                            <th style={{ padding: '3px 5px', textAlign: 'center', borderRight: '1px solid #334155' }}>Type</th>
                            <th style={{ padding: '3px 5px', textAlign: 'center', borderRight: '1px solid #334155' }}>Make & Model</th>
                            <th style={{ padding: '3px 5px', textAlign: 'center', borderRight: '1px solid #334155' }}>Registration No.</th>
                            <th style={{ padding: '3px 5px', textAlign: 'center', borderRight: '1px solid #334155' }}>Year</th>
                            <th style={{ padding: '3px 5px', textAlign: 'center', borderRight: '1px solid #334155' }}>Color</th>
                            <th style={{ padding: '3px 5px', textAlign: 'center', borderRight: '1px solid #334155' }}>Chassis No.</th>
                            <th style={{ padding: '3px 5px', textAlign: 'center' }}>Engine No.</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr style={{ textAlign: 'center', background: '#ffffff', color: '#0f172a' }}>
                            <td style={{ padding: '3px 5px', borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1', fontWeight: 700 }}>{vehicleType}</td>
                            <td style={{ padding: '3px 5px', borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1', fontWeight: 700 }}>{vehicleName}</td>
                            <td style={{ padding: '3px 5px', borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1', fontWeight: 800, color: '#1e40af' }}>{regNumber}</td>
                            <td style={{ padding: '3px 5px', borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }}>{vehicleYear}</td>
                            <td style={{ padding: '3px 5px', borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }}>{color}</td>
                            <td style={{ padding: '3px 5px', borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1', fontFamily: 'monospace' }}>{chassisNo}</td>
                            <td style={{ padding: '3px 5px', borderBottom: '1px solid #cbd5e1', fontFamily: 'monospace' }}>{engineNo}</td>
                        </tr>
                    </tbody>
                </table>

                {/* 5. SCHEDULE 'B': REVENUE SHARING & COMMERCIAL TERMS */}
                <div style={{ fontSize: '8px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', marginBottom: '2px' }}>
                    2. SCHEDULE 'B' — COMMERCIAL CONSIDERATION & REVENUE SPLIT
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '6px', fontSize: '7.5px', border: '1px solid #cbd5e1' }}>
                    <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #cbd5e1' }}>
                            <th style={{ padding: '3px 5px', textAlign: 'left', borderRight: '1px solid #cbd5e1' }}>Base Customer Tariff</th>
                            <th style={{ padding: '3px 5px', textAlign: 'left', borderRight: '1px solid #cbd5e1', color: '#15803d' }}>Sponsor Share ({sponsorPercent}%)</th>
                            <th style={{ padding: '3px 5px', textAlign: 'left', borderRight: '1px solid #cbd5e1' }}>RentHub Commission ({platformPercent}%)</th>
                            <th style={{ padding: '3px 5px', textAlign: 'left' }}>Settlement Cycle</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style={{ padding: '3px 5px', borderRight: '1px solid #cbd5e1', fontWeight: 700 }}>₹{hourlyRate.toFixed(2)}/hr (₹{dailyRate.toFixed(2)}/day)</td>
                            <td style={{ padding: '3px 5px', borderRight: '1px solid #cbd5e1', fontWeight: 800, color: '#15803d' }}>₹{sponsorHourlyPayout}/hr (₹{sponsorDailyPayout.toFixed(2)}/day)</td>
                            <td style={{ padding: '3px 5px', borderRight: '1px solid #cbd5e1' }}>₹{(hourlyRate * (platformPercent / 100)).toFixed(1)}/hr ({platformPercent}%)</td>
                            <td style={{ padding: '3px 5px', fontWeight: 700 }}>Weekly Auto-Transfer (Every Monday)</td>
                        </tr>
                    </tbody>
                </table>

                {/* 6. OPERATIVE CLAUSES */}
                <div style={{ fontSize: '8px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', marginBottom: '2px' }}>
                    3. KEY OPERATIONAL & STATUTORY COVENANTS
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '6px', fontSize: '7px', border: '1px solid #cbd5e1', background: '#fafafa' }}>
                    <tbody>
                        <tr>
                            <td style={{ width: '50%', padding: '4px 6px', verticalAlign: 'top', borderRight: '1px solid #cbd5e1', lineHeight: '1.3' }}>
                                <strong>RentHub Responsibilities:</strong><br />
                                • Provide 24x7 app technology, verified bookings & payment gateway.<br />
                                • Fit certified AIS-140 anti-theft GPS tracker & remote immobilizer.<br />
                                • Comprehensive transit insurance coverage on all active trips.<br />
                                • Disburse automated 70% revenue share weekly without delay.
                            </td>
                            <td style={{ width: '50%', padding: '4px 6px', verticalAlign: 'top', lineHeight: '1.3' }}>
                                <strong>Sponsor / Owner Responsibilities:</strong><br />
                                • Ensure vehicle possesses valid RC, Insurance, and PUC certificates.<br />
                                • Maintain vehicle in clean, roadworthy, and safe operational condition.<br />
                                • Authorize RentHub to deploy vehicle exclusively for customer rentals.<br />
                                • Provide 15 days prior written notice in case of voluntary exit.
                            </td>
                        </tr>
                    </tbody>
                </table>

                {/* 7. VERIFICATION & DURATION CARDS */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '6px', fontSize: '7px' }}>
                    <tbody>
                        <tr>
                            {/* Card 1: Verified Docs */}
                            <td style={{ width: '33%', padding: '4px 6px', border: '1px solid #bbf7d0', background: '#f0fdf4', verticalAlign: 'top', borderRadius: '4px' }}>
                                <strong style={{ color: '#15803d', fontSize: '7.5px', display: 'block', marginBottom: '1px' }}>DOCUMENTS VERIFIED</strong>
                                <div>{hasRC ? '✓' : '✗'} RC (Registration Certificate)</div>
                                <div>{hasInsurance ? '✓' : '✗'} Insurance Policy</div>
                                <div>{hasPUC ? '✓' : '✗'} PUC Certificate</div>
                                <div>{hasIdentity ? '✓' : '✗'} Owner Identity Proof</div>
                                <div>{hasPhotos ? '✓' : '✗'} Vehicle Photo Audit</div>
                                <div>{hasSurvey ? '✓' : '✗'} 24-Pt Technical Survey</div>
                            </td>

                            <td style={{ width: '1%' }}></td>

                            {/* Card 2: Duration */}
                            <td style={{ width: '33%', padding: '4px 6px', border: '1px solid #bfdbfe', background: '#f8fbff', verticalAlign: 'top', borderRadius: '4px' }}>
                                <strong style={{ color: '#1e40af', fontSize: '7.5px', display: 'block', marginBottom: '1px' }}>AGREEMENT DURATION</strong>
                                <div>Tenure: <strong>12 Months Active</strong></div>
                                <div>Valid From: <strong>{contractDateStr}</strong></div>
                                <div>Valid To: <strong>{validToStr}</strong></div>
                                <div style={{ fontSize: '6px', color: '#64748b', marginTop: '1px' }}>Renewal subject to mutual consensus.</div>
                            </td>

                            <td style={{ width: '1%' }}></td>

                            {/* Card 3: Termination */}
                            <td style={{ width: '32%', padding: '4px 6px', border: '1px solid #fecaca', background: '#fef2f2', verticalAlign: 'top', borderRadius: '4px' }}>
                                <strong style={{ color: '#b91c1c', fontSize: '7.5px', display: 'block', marginBottom: '1px' }}>TERMINATION CLAUSE</strong>
                                <div style={{ lineHeight: '1.25' }}>
                                    Either party may terminate this agreement with <strong>15-day prior written notice</strong> for breach of terms, vehicle withdrawal, or operational policy violation.
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* 8. SIGNATURES & BOTTOM SEAL */}
            <div style={{ marginTop: 'auto' }}>
                <div style={{ fontSize: '8px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', marginBottom: '2px' }}>
                    4. EXECUTION & ATTESTATION
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #0f172a', background: '#ffffff', marginBottom: '4px' }}>
                    <tbody>
                        <tr>
                            {/* Operator Signatory */}
                            <td style={{ width: '40%', padding: '5px 8px', verticalAlign: 'top', borderRight: '1px solid #cbd5e1' }}>
                                <div style={{ fontSize: '7px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase' }}>
                                    For RentHub Mobility Private Limited
                                </div>
                                <div style={{ fontFamily: "'Brush Script MT', cursive, sans-serif", fontSize: '18px', color: '#1e3a8a', height: '24px', display: 'flex', alignItems: 'center' }}>
                                    G. Reddy
                                </div>
                                <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: '1px', fontSize: '6.5px', color: '#64748b' }}>
                                    <div>Authorized Legal Signatory</div>
                                    <div>Date: {contractDateStr}</div>
                                </div>
                            </td>

                            {/* Official Stamp */}
                            <td style={{ width: '20%', padding: '2px', textAlign: 'center', verticalAlign: 'middle', borderRight: '1px solid #cbd5e1', background: '#f8fafc' }}>
                                <div style={{ width: '44px', height: '44px', margin: '0 auto', borderRadius: '50%', border: '1.5px solid #1e40af', color: '#1e40af', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontSize: '4.5px', fontWeight: 800, textTransform: 'uppercase', lineHeight: 1.05, transform: 'rotate(-4deg)' }}>
                                    <span>RENTHUB</span>
                                    <span style={{ fontSize: '6.5px' }}>★ RH ★</span>
                                    <span>VERIFIED</span>
                                </div>
                            </td>

                            {/* Sponsor Signatory */}
                            <td style={{ width: '40%', padding: '5px 8px', verticalAlign: 'top' }}>
                                <div style={{ fontSize: '7px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Vehicle Sponsor / Owner</span>
                                    <span style={{ color: '#15803d', fontSize: '6px' }}>✓ E-SIGN VERIFIED</span>
                                </div>
                                <div style={{ fontFamily: "'Brush Script MT', cursive, sans-serif", fontSize: '17px', color: '#15803d', height: '24px', display: 'flex', alignItems: 'center' }}>
                                    {sponsorName}
                                </div>
                                <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: '1px', fontSize: '6.5px', color: '#64748b' }}>
                                    <div>Signature of Vehicle Owner</div>
                                    <div>Date: {contractDateStr}</div>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>

                {/* Footer Strip */}
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '2px 6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '6px', color: '#64748b' }}>
                    <span>This document is legally enforceable under the Indian Contract Act, 1872 & IT Act, 2000.</span>
                    <span>RentHub Technologies Pvt. Ltd. • www.renthub.in • Support: support@renthub.in</span>
                </div>
            </div>
        </div>
    );
});

export default ContractDocument;
