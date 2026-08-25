import React, { forwardRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const downloadContractPDF = async (elementRef, filename = 'RentHub_Partnership_Agreement.pdf') => {
    if (!elementRef || !elementRef.current) return;
    try {
        const element = elementRef.current;
        const canvas = await html2canvas(element, {
            scale: 2.5,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.98);
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
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
    const sponsorAddress = sponsor.address || trackingData.sponsor_address || 'Bhubaneswar, Odisha, India';
    const sponsorId = sponsor.id ? `SP-${sponsor.id.toString().slice(-6).toUpperCase()}` : (trackingData.tracking_id || 'SP-000123');

    const rawId = (trackingData.id || '123').toString();
    const agreementId = `RH-SP-2025-${rawId.padStart(6, '0')}`;
    const vehicleName = `${trackingData.name || ''} ${trackingData.model || ''}`.trim() || 'Honda Activa 6G';
    const regNumber = trackingData.registration_number || 'OD02AB1234';
    const vehicleType = (trackingData.vehicle_type || 'Bike').toUpperCase();
    const vehicleYear = trackingData.year || '2023';
    const color = trackingData.color || trackingData.vehicle_details?.color || 'Matte Black';
    const chassisNo = trackingData.chassis_number || trackingData.vehicle_details?.chassis_number || `MBLAH12345P${rawId.padStart(6, '0')}`;
    const engineNo = trackingData.engine_number || trackingData.vehicle_details?.engine_number || `HA11E12${rawId.padStart(5, '0')}`;

    const hourlyRate = parseFloat(trackingData.pricing_terms?.proposed_price || trackingData.price || 80);
    const dailyRate = Math.round(hourlyRate * 10);
    const sponsorDailyPayout = Math.round(dailyRate * 0.70);

    const contractDateObj = trackingData.agreement_accepted_at ? new Date(trackingData.agreement_accepted_at) : new Date();
    const contractDateStr = contractDateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    const validToObj = new Date(contractDateObj);
    validToObj.setFullYear(validToObj.getFullYear() + 1);
    validToObj.setDate(validToObj.getDate() - 1);
    const validToStr = validToObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    return (
        <div
            ref={ref}
            id="renthub-partnership-agreement"
            style={{
                width: '794px', // Standard A4 width at 96 DPI
                height: '1123px', // Standard A4 height at 96 DPI
                padding: '20px 24px',
                backgroundColor: '#ffffff',
                color: '#0f172a',
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
                boxSizing: 'border-box',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                border: '1.5px solid #cbd5e1',
                lineHeight: '1.3',
                overflow: 'hidden'
            }}
        >
            {/* Background Watermark */}
            <div style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%, -50%) rotate(-25deg)', pointerEvents: 'none', zIndex: 0, opacity: 0.035, textAlign: 'center' }}>
                <div style={{ fontSize: '110px', fontWeight: 900, color: '#0f172a', letterSpacing: '4px' }}>RH</div>
                <div style={{ fontSize: '40px', fontWeight: 800, color: '#0f172a', letterSpacing: '6px' }}>RENTHUB</div>
            </div>

            <div style={{ position: 'relative', zIndex: 1 }}>
                {/* 1. TOP HEADER SECTION */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1.5px solid #0284c7', paddingBottom: '8px', marginBottom: '8px' }}>
                    {/* Brand Logo */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', lineHeight: 1 }}>
                            <span style={{ fontSize: '32px', fontWeight: 900, color: '#0f172a', letterSpacing: '-2px', fontFamily: 'system-ui, sans-serif' }}>R</span>
                            <span style={{ fontSize: '32px', fontWeight: 900, color: '#0284c7', letterSpacing: '-2px', marginLeft: '-2px', fontFamily: 'system-ui, sans-serif' }}>H</span>
                        </div>
                        <div>
                            <div style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.5px', lineHeight: 1 }}>
                                RENT<span style={{ color: '#0284c7' }}>HUB</span>
                            </div>
                            <span style={{ fontSize: '8px', fontWeight: 700, color: '#64748b', display: 'block', marginTop: '2px' }}>
                                Smart Mobility, Delivered To Your Door
                            </span>
                        </div>
                    </div>

                    {/* Title */}
                    <div style={{ textAlign: 'center' }}>
                        <h1 style={{ margin: 0, fontSize: '17px', fontWeight: 900, color: '#0f172a', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                            VEHICLE SPONSOR PARTNERSHIP AGREEMENT
                        </h1>
                        <div style={{ fontSize: '9px', fontWeight: 700, color: '#0284c7', marginTop: '2px', letterSpacing: '0.2px' }}>
                            — Agreement for Vehicle Listing, Operations & Revenue Sharing —
                        </div>
                    </div>

                    {/* Agreement ID & Date Box */}
                    <div style={{ border: '1.5px solid #bfdbfe', borderRadius: '8px', background: '#f8fbff', padding: '4px 10px', textAlign: 'left', minWidth: '130px' }}>
                        <div style={{ fontSize: '7.5px', fontWeight: 800, color: '#1e40af', textTransform: 'uppercase' }}>AGREEMENT ID</div>
                        <div style={{ fontSize: '9.5px', fontWeight: 800, color: '#0f172a', fontFamily: 'monospace' }}>{agreementId}</div>
                        <div style={{ borderTop: '1px solid #e2e8f0', margin: '2px 0' }} />
                        <div style={{ fontSize: '7.5px', fontWeight: 800, color: '#1e40af', textTransform: 'uppercase' }}>DATE</div>
                        <div style={{ fontSize: '9.5px', fontWeight: 800, color: '#0f172a' }}>{contractDateStr}</div>
                    </div>
                </div>

                {/* Preamble Text */}
                <p style={{ margin: '0 0 8px', fontSize: '8.5px', color: '#334155', lineHeight: '1.35', textAlign: 'justify' }}>
                    This Vehicle Sponsor Partnership Agreement (<strong>"Agreement"</strong>) is made and entered into between <strong>RentHub Mobility Private Limited ("RentHub")</strong> and the undersigned Vehicle Sponsor (<strong>"Sponsor"</strong>) for the listing, operation and management of the vehicle on the RentHub platform.
                </p>

                {/* 2. PARTIES SECTION (RENTHUB & SPONSOR) */}
                <div style={{ border: '1.5px solid #bfdbfe', borderRadius: '10px', background: '#f8fbff', padding: '8px 14px', display: 'grid', gridTemplateColumns: '1fr 1.15fr', gap: '16px', marginBottom: '8px' }}>
                    {/* Left: RentHub Operator */}
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontSize: '16px', flexShrink: 0, marginTop: '2px' }}>
                            🏢
                        </div>
                        <div>
                            <span style={{ fontSize: '9px', fontWeight: 900, color: '#1e40af', textTransform: 'uppercase', display: 'block' }}>
                                RENTHUB (OPERATOR)
                            </span>
                            <strong style={{ fontSize: '10px', color: '#0f172a', display: 'block', marginTop: '1px' }}>
                                RentHub Mobility Private Limited
                            </strong>
                            <span style={{ fontSize: '8.5px', color: '#475569', display: 'block' }}>Bhubaneswar, Odisha, India</span>
                            <span style={{ fontSize: '8.5px', color: '#475569', display: 'block' }}>+91 98765 43210</span>
                            <span style={{ fontSize: '8.5px', color: '#2563eb', fontWeight: 700, display: 'block' }}>support@renthub.in</span>
                            <span style={{ fontSize: '8.5px', color: '#2563eb', fontWeight: 700, display: 'block' }}>www.renthub.in</span>
                        </div>
                    </div>

                    {/* Right: Vehicle Sponsor */}
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', borderLeft: '1px solid #e2e8f0', paddingLeft: '14px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontSize: '16px', flexShrink: 0, marginTop: '2px' }}>
                            👤
                        </div>
                        <div style={{ width: '100%', fontSize: '8.5px' }}>
                            <span style={{ fontSize: '9px', fontWeight: 900, color: '#15803d', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>
                                VEHICLE SPONSOR
                            </span>
                            <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr', gap: '2px', alignItems: 'center' }}>
                                <span style={{ color: '#475569', fontWeight: 600 }}>Name :</span>
                                <strong style={{ color: '#0f172a', borderBottom: '1px solid #cbd5e1', paddingBottom: '1px' }}>{sponsorName}</strong>

                                <span style={{ color: '#475569', fontWeight: 600 }}>Sponsor ID :</span>
                                <span style={{ color: '#0f172a', borderBottom: '1px solid #cbd5e1', paddingBottom: '1px', fontWeight: 700 }}>{sponsorId}</span>

                                <span style={{ color: '#475569', fontWeight: 600 }}>Mobile No. :</span>
                                <span style={{ color: '#0f172a', borderBottom: '1px solid #cbd5e1', paddingBottom: '1px' }}>{sponsorPhone}</span>

                                <span style={{ color: '#475569', fontWeight: 600 }}>Email ID :</span>
                                <span style={{ color: '#0f172a', borderBottom: '1px solid #cbd5e1', paddingBottom: '1px' }}>{sponsorEmail}</span>

                                <span style={{ color: '#475569', fontWeight: 600 }}>Address :</span>
                                <span style={{ color: '#0f172a', borderBottom: '1px solid #cbd5e1', paddingBottom: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sponsorAddress}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. SECTION 1: VEHICLE DETAILS */}
                <div style={{ marginBottom: '8px' }}>
                    <div style={{ fontSize: '9.5px', fontWeight: 900, color: '#1e40af', textTransform: 'uppercase', marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span>🛵 1. VEHICLE DETAILS</span>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8px', border: '1px solid #0f2b48' }}>
                        <thead>
                            <tr style={{ background: '#0f2b48', color: '#ffffff' }}>
                                <th style={{ padding: '4px 6px', textAlign: 'center', borderRight: '1px solid #1e3a8a', fontWeight: 800 }}>Vehicle Type</th>
                                <th style={{ padding: '4px 6px', textAlign: 'center', borderRight: '1px solid #1e3a8a', fontWeight: 800 }}>Make & Model</th>
                                <th style={{ padding: '4px 6px', textAlign: 'center', borderRight: '1px solid #1e3a8a', fontWeight: 800 }}>Registration No.</th>
                                <th style={{ padding: '4px 6px', textAlign: 'center', borderRight: '1px solid #1e3a8a', fontWeight: 800 }}>Year of Mfg.</th>
                                <th style={{ padding: '4px 6px', textAlign: 'center', borderRight: '1px solid #1e3a8a', fontWeight: 800 }}>Color</th>
                                <th style={{ padding: '4px 6px', textAlign: 'center', borderRight: '1px solid #1e3a8a', fontWeight: 800 }}>Chassis No.</th>
                                <th style={{ padding: '4px 6px', textAlign: 'center', fontWeight: 800 }}>Engine No.</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr style={{ background: '#ffffff', textAlign: 'center', fontWeight: 700, color: '#0f172a' }}>
                                <td style={{ padding: '4px 6px', borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }}>{vehicleType}</td>
                                <td style={{ padding: '4px 6px', borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }}>{vehicleName}</td>
                                <td style={{ padding: '4px 6px', borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1', color: '#1e40af' }}>{regNumber}</td>
                                <td style={{ padding: '4px 6px', borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }}>{vehicleYear}</td>
                                <td style={{ padding: '4px 6px', borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }}>{color}</td>
                                <td style={{ padding: '4px 6px', borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1', fontFamily: 'monospace' }}>{chassisNo}</td>
                                <td style={{ padding: '4px 6px', borderBottom: '1px solid #cbd5e1', fontFamily: 'monospace' }}>{engineNo}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* 4. SECTION 2 & 3: AGREEMENT TERMS & REVENUE SHARING */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px', marginBottom: '8px' }}>
                    {/* Section 2: Agreement Terms */}
                    <div>
                        <div style={{ fontSize: '9.5px', fontWeight: 900, color: '#1e40af', textTransform: 'uppercase', marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span>📄 2. AGREEMENT TERMS</span>
                        </div>
                        <ul style={{ margin: 0, paddingLeft: '14px', fontSize: '7.5px', color: '#334155', display: 'flex', flexDirection: 'column', gap: '2px', lineHeight: '1.3' }}>
                            <li>The Sponsor agrees to list the above vehicle on the RentHub platform for rental services.</li>
                            <li>The vehicle will be used only for legal, authorized and rental purposes.</li>
                            <li>RentHub will manage bookings, customers, payments and support.</li>
                            <li>Sponsor will ensure the vehicle is in good working condition and roadworthy.</li>
                            <li>Sponsor must comply with all traffic laws, RTO rules and platform policies.</li>
                        </ul>
                    </div>

                    {/* Section 3: Revenue Sharing Table */}
                    <div>
                        <div style={{ fontSize: '9.5px', fontWeight: 900, color: '#15803d', textTransform: 'uppercase', marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span>💰 3. REVENUE SHARING</span>
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', overflow: 'hidden' }}>
                            <tbody>
                                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                    <td style={{ padding: '3px 6px', color: '#475569', fontWeight: 600 }}>Rental Price (Per Day)</td>
                                    <td style={{ padding: '3px 6px', textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>₹ {dailyRate.toFixed(2)}</td>
                                </tr>
                                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                    <td style={{ padding: '3px 6px', color: '#475569', fontWeight: 600 }}>Sponsor Share</td>
                                    <td style={{ padding: '3px 6px', textAlign: 'right', fontWeight: 800, color: '#15803d' }}>70%</td>
                                </tr>
                                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                    <td style={{ padding: '3px 6px', color: '#475569', fontWeight: 600 }}>RentHub Commission</td>
                                    <td style={{ padding: '3px 6px', textAlign: 'right', fontWeight: 800, color: '#475569' }}>30%</td>
                                </tr>
                                <tr style={{ background: '#dcfce7', color: '#166534' }}>
                                    <td style={{ padding: '4px 6px', fontWeight: 800 }}>Estimated Payout to Sponsor (Per Day)</td>
                                    <td style={{ padding: '4px 6px', textAlign: 'right', fontWeight: 900, fontSize: '9.5px' }}>₹ {sponsorDailyPayout.toFixed(2)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 5. SECTION 4: RESPONSIBILITIES */}
                <div style={{ marginBottom: '8px' }}>
                    <div style={{ fontSize: '9.5px', fontWeight: 900, color: '#1e40af', textTransform: 'uppercase', marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>🛡️ 4. RESPONSIBILITIES</span>
                    </div>
                    <div style={{ border: '1px solid #bfdbfe', borderRadius: '8px', background: '#f8fbff', padding: '6px 12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        {/* RentHub Responsibilities */}
                        <div>
                            <span style={{ fontSize: '8.5px', fontWeight: 800, color: '#1e40af', display: 'block', marginBottom: '2px' }}>RentHub Responsibilities</span>
                            <div style={{ fontSize: '7.5px', color: '#334155', display: 'flex', flexDirection: 'column', gap: '1.5px', lineHeight: '1.25' }}>
                                <div><span style={{ color: '#2563eb', fontWeight: 900 }}>✓</span> Provide platform, technology and booking management</div>
                                <div><span style={{ color: '#2563eb', fontWeight: 900 }}>✓</span> Handle customer support and secure payments</div>
                                <div><span style={{ color: '#2563eb', fontWeight: 900 }}>✓</span> Marketing, promotions and visibility</div>
                                <div><span style={{ color: '#2563eb', fontWeight: 900 }}>✓</span> Share earnings as per agreed ratio</div>
                                <div><span style={{ color: '#2563eb', fontWeight: 900 }}>✓</span> Provide insurance guidance and operational support</div>
                            </div>
                        </div>

                        {/* Sponsor Responsibilities */}
                        <div>
                            <span style={{ fontSize: '8.5px', fontWeight: 800, color: '#15803d', display: 'block', marginBottom: '2px' }}>Sponsor Responsibilities</span>
                            <div style={{ fontSize: '7.5px', color: '#334155', display: 'flex', flexDirection: 'column', gap: '1.5px', lineHeight: '1.25' }}>
                                <div><span style={{ color: '#16a34a', fontWeight: 900 }}>✓</span> Provide genuine vehicle and valid documents</div>
                                <div><span style={{ color: '#16a34a', fontWeight: 900 }}>✓</span> Maintain vehicle in good condition</div>
                                <div><span style={{ color: '#16a34a', fontWeight: 900 }}>✓</span> Timely respond to damage or maintenance issues</div>
                                <div><span style={{ color: '#16a34a', fontWeight: 900 }}>✓</span> Follow platform rules and policies</div>
                                <div><span style={{ color: '#16a34a', fontWeight: 900 }}>✓</span> Ensure vehicle availability as per bookings</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 6. SECTION 5, 6, 7 (THREE CARDS) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.15fr 1fr', gap: '8px', marginBottom: '8px' }}>
                    {/* Card 5: Documents Verified */}
                    <div style={{ border: '1px solid #bbf7d0', borderRadius: '8px', background: '#f0fdf4', padding: '6px 8px' }}>
                        <div style={{ fontSize: '8.5px', fontWeight: 900, color: '#15803d', textTransform: 'uppercase', marginBottom: '3px' }}>
                            📁 5. DOCUMENTS VERIFIED
                        </div>
                        <div style={{ fontSize: '7px', color: '#166534', display: 'flex', flexDirection: 'column', gap: '1.5px', fontWeight: 600 }}>
                            <div>☑ RC (Registration Certificate)</div>
                            <div>☑ Insurance Certificate</div>
                            <div>☑ PUC Certificate</div>
                            <div>☑ Owner Identity Proof</div>
                            <div>☑ Address Proof</div>
                            <div>☑ Vehicle Photos (Front, Back, Sides)</div>
                            <div>☑ Survey Report</div>
                        </div>
                    </div>

                    {/* Card 6: Agreement Duration */}
                    <div style={{ border: '1px solid #bfdbfe', borderRadius: '8px', background: '#f8fbff', padding: '6px 8px' }}>
                        <div style={{ fontSize: '8.5px', fontWeight: 900, color: '#1e40af', textTransform: 'uppercase', marginBottom: '3px' }}>
                            📅 6. AGREEMENT DURATION
                        </div>
                        <p style={{ margin: '0 0 3px', fontSize: '7.5px', color: '#334155' }}>
                            This Agreement is valid for a period of <strong>12 Months</strong> from the date of activation.
                        </p>
                        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '3px 6px', fontSize: '7.5px', display: 'flex', flexDirection: 'column', gap: '1.5px', marginBottom: '3px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#64748b' }}>Valid From :</span>
                                <strong style={{ color: '#0f172a' }}>{contractDateStr}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#64748b' }}>Valid To :</span>
                                <strong style={{ color: '#0f172a' }}>{validToStr}</strong>
                            </div>
                        </div>
                        <span style={{ fontSize: '6.5px', color: '#64748b', display: 'block', lineHeight: '1.2' }}>
                            Renewal is subject to performance review and mutual agreement.
                        </span>
                    </div>

                    {/* Card 7: Termination */}
                    <div style={{ border: '1px solid #fecaca', borderRadius: '8px', background: '#fef2f2', padding: '6px 8px' }}>
                        <div style={{ fontSize: '8.5px', fontWeight: 900, color: '#b91c1c', textTransform: 'uppercase', marginBottom: '3px' }}>
                            ❌ 7. TERMINATION
                        </div>
                        <p style={{ margin: 0, fontSize: '7.5px', color: '#334155', lineHeight: '1.3' }}>
                            Either party may terminate this Agreement with a <strong>15-day prior</strong> written notice in case of breach of terms, misuse, fraud, or violation of platform policies.
                        </p>
                    </div>
                </div>
            </div>

            {/* 7. SECTION 8: SIGNATURES & BOTTOM FOOTER BAR */}
            <div style={{ position: 'relative', zIndex: 1 }}>
                {/* 8. SIGNATURES */}
                <div style={{ marginBottom: '6px' }}>
                    <div style={{ fontSize: '9.5px', fontWeight: 900, color: '#1e40af', textTransform: 'uppercase', marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>✍️ 8. SIGNATURES</span>
                    </div>
                    <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', background: '#ffffff', padding: '6px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        {/* Operator Signatory */}
                        <div style={{ textAlign: 'left', width: '220px' }}>
                            <span style={{ fontSize: '8px', fontWeight: 800, color: '#0f172a', display: 'block' }}>For RentHub Mobility Private Limited</span>
                            <div style={{ fontFamily: "'Brush Script MT', cursive, sans-serif", fontSize: '20px', color: '#1e3a8a', height: '26px', display: 'flex', alignItems: 'center' }}>
                                G. Reddy
                            </div>
                            <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: '2px', fontSize: '7.5px', color: '#64748b' }}>
                                <div>Authorized Signatory</div>
                                <div>Date: {contractDateStr}</div>
                            </div>
                        </div>

                        {/* Verified Stamp Emblem */}
                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', border: '2px dashed #1d4ed8', color: '#1d4ed8', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontSize: '5px', fontWeight: 900, textTransform: 'uppercase', textAlign: 'center', transform: 'rotate(-5deg)', lineHeight: 1.1, background: '#f8fbff' }}>
                            <span>RENTHUB</span>
                            <span style={{ fontSize: '10px' }}>★ RH ★</span>
                            <span>VERIFIED</span>
                        </div>

                        {/* Sponsor Signatory */}
                        <div style={{ textAlign: 'left', width: '220px' }}>
                            <span style={{ fontSize: '8px', fontWeight: 800, color: '#0f172a', display: 'block' }}>Vehicle Sponsor</span>
                            <div style={{ fontFamily: "'Brush Script MT', cursive, sans-serif", fontSize: '18px', color: '#15803d', height: '26px', display: 'flex', alignItems: 'center' }}>
                                {sponsorName}
                            </div>
                            <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: '2px', fontSize: '7.5px', color: '#64748b' }}>
                                <div>Sponsor Signature</div>
                                <div>Date: {contractDateStr}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* BOTTOM FOOTER BAR */}
                <div style={{ background: '#f0f7ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '4px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '13px' }}>🛡️</span>
                        <div>
                            <span style={{ fontSize: '7.5px', fontWeight: 800, color: '#1e40af', display: 'block' }}>IMPORTANT NOTE</span>
                            <span style={{ fontSize: '7px', color: '#334155' }}>RentHub will never ask for security deposit for listing. All payments are safely handled through our secure gateway.</span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', textAlign: 'right' }}>
                        <div>
                            <span style={{ fontSize: '7.5px', fontWeight: 800, color: '#1e40af', display: 'block' }}>Thank you for partnering with RentHub.</span>
                            <span style={{ fontSize: '7px', color: '#2563eb', fontWeight: 700 }}>Together, let's drive the future of mobility!</span>
                        </div>
                        <span style={{ fontSize: '18px' }}>🛵</span>
                    </div>
                </div>
            </div>
        </div>
    );
});

export default ContractDocument;
