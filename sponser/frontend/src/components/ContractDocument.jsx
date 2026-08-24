import React, { forwardRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const downloadContractPDF = async (elementRef, filename = 'RentHub_Partnership_Contract.pdf') => {
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
    const sponsorName = sponsor.full_name || trackingData.sponsor_name || 'Authorized Vehicle Sponsor';
    const sponsorPhone = sponsor.phone_number || trackingData.sponsor_phone || 'N/A';
    const sponsorEmail = sponsor.email || trackingData.sponsor_email || 'N/A';
    const trackingId = trackingData.tracking_id || `RH-REQ-${trackingData.id || '1001'}`;
    const vehicleName = `${trackingData.name || ''} ${trackingData.model || ''}`.trim() || 'Commercial Vehicle';
    const regNumber = trackingData.registration_number || 'REG-PENDING';
    const vehicleType = (trackingData.vehicle_type || 'bike').toUpperCase();
    const vehicleYear = trackingData.year || new Date().getFullYear();

    const hourlyRate = parseFloat(trackingData.pricing_terms?.proposed_price || trackingData.price || 65);
    const sponsorShare = (hourlyRate * 0.70).toFixed(1);
    const contractDate = trackingData.agreement_accepted_at
        ? new Date(trackingData.agreement_accepted_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
        : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    return (
        <div
            ref={ref}
            id="renthub-legal-contract"
            style={{
                width: '794px', // Standard A4 width at 96 DPI
                minHeight: '1120px', // Standard A4 height at 96 DPI
                maxHeight: '1122px',
                padding: '32px 36px',
                backgroundColor: '#ffffff',
                color: '#0f172a',
                fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
                boxSizing: 'border-box',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                border: '1px solid #e2e8f0',
                fontSize: '11px',
                lineHeight: '1.45',
                overflow: 'hidden'
            }}
        >
            {/* Top Watermark / Decorative Border */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '6px', background: 'linear-gradient(90deg, #4f46e5 0%, #06b6d4 100%)' }} />

            <div>
                {/* 1. HEADER */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #0f172a', paddingBottom: '12px', marginBottom: '14px' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'linear-gradient(135deg, #4f46e5, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontWeight: 900, fontSize: '15px' }}>
                                R
                            </div>
                            <div>
                                <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 900, letterSpacing: '-0.5px', color: '#0f172a' }}>RentHub Mobility</h1>
                                <span style={{ fontSize: '9px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Smart Urban Fleet Partnership Network</span>
                            </div>
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <span style={{ display: 'inline-block', background: '#eef2ff', color: '#4338ca', border: '1px solid #c7d2fe', padding: '2px 8px', borderRadius: '6px', fontSize: '9px', fontWeight: 800 }}>
                            OFFICIAL LEGAL CONTRACT
                        </span>
                        <div style={{ marginTop: '4px', fontSize: '9.5px', color: '#334155' }}>
                            Ref: <strong>{trackingId}</strong> | Date: <strong>{contractDate}</strong>
                        </div>
                    </div>
                </div>

                {/* TITLE */}
                <div style={{ textAlign: 'center', marginBottom: '14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px 12px' }}>
                    <h2 style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Vehicle Lease & Revenue Share Partnership Agreement
                    </h2>
                    <p style={{ margin: '2px 0 0', fontSize: '9.5px', color: '#64748b' }}>
                        Executed under the Indian Contract Act, 1872 & Motor Vehicles Act guidelines
                    </p>
                </div>

                {/* 2. PARTIES SECTION */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                    <div style={{ background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: '8px', padding: '8px 10px' }}>
                        <span style={{ fontSize: '9px', fontWeight: 800, color: '#7e22ce', textTransform: 'uppercase', display: 'block', marginBottom: '3px' }}>
                            Party 1: Platform Operator
                        </span>
                        <strong style={{ fontSize: '11px', color: '#0f172a', display: 'block' }}>RentHub Technologies Pvt. Ltd.</strong>
                        <span style={{ fontSize: '9px', color: '#64748b', display: 'block' }}>CIN: U72900KA2024PTC189210</span>
                        <span style={{ fontSize: '9px', color: '#64748b', display: 'block' }}>Fleet Operations Center, Municipal Mobility Hub</span>
                    </div>

                    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '8px 10px' }}>
                        <span style={{ fontSize: '9px', fontWeight: 800, color: '#15803d', textTransform: 'uppercase', display: 'block', marginBottom: '3px' }}>
                            Party 2: Fleet Partner / Sponsor
                        </span>
                        <strong style={{ fontSize: '11px', color: '#0f172a', display: 'block' }}>{sponsorName}</strong>
                        <span style={{ fontSize: '9px', color: '#64748b', display: 'block' }}>Phone: {sponsorPhone} | Email: {sponsorEmail}</span>
                        <span style={{ fontSize: '9px', color: '#64748b', display: 'block' }}>Sponsor Tracking Ref: {trackingId}</span>
                    </div>
                </div>

                {/* 3. VEHICLE & COMMERCIAL TERMS */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px', marginBottom: '12px' }}>
                    {/* Vehicle Schedule */}
                    <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '8px 10px', background: '#ffffff' }}>
                        <div style={{ fontWeight: 800, fontSize: '10px', color: '#1e293b', borderBottom: '1px solid #f1f5f9', paddingBottom: '3px', marginBottom: '6px', textTransform: 'uppercase' }}>
                            🏍️ Vehicle Asset Schedule
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '9.5px' }}>
                            <div>
                                <span style={{ color: '#64748b', display: 'block', fontSize: '8.5px' }}>Vehicle Asset</span>
                                <strong>{vehicleName}</strong>
                            </div>
                            <div>
                                <span style={{ color: '#64748b', display: 'block', fontSize: '8.5px' }}>Registration No</span>
                                <strong style={{ color: '#4338ca' }}>{regNumber}</strong>
                            </div>
                            <div>
                                <span style={{ color: '#64748b', display: 'block', fontSize: '8.5px' }}>Class / Category</span>
                                <strong>{vehicleType}</strong>
                            </div>
                            <div>
                                <span style={{ color: '#64748b', display: 'block', fontSize: '8.5px' }}>Year of Mfr</span>
                                <strong>{vehicleYear}</strong>
                            </div>
                        </div>
                    </div>

                    {/* Commercial Terms */}
                    <div style={{ border: '1px solid #fef08a', borderRadius: '8px', padding: '8px 10px', background: '#fefce8' }}>
                        <div style={{ fontWeight: 800, fontSize: '10px', color: '#854d0e', borderBottom: '1px solid #fef9c3', paddingBottom: '3px', marginBottom: '6px', textTransform: 'uppercase' }}>
                            💰 Agreed Commercial Terms
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '9.5px' }}>
                            <div>
                                <span style={{ color: '#713f12', display: 'block', fontSize: '8.5px' }}>Customer Hourly Rent</span>
                                <strong style={{ fontSize: '11px', color: '#0f172a' }}>₹{hourlyRate}/hr</strong>
                            </div>
                            <div>
                                <span style={{ color: '#713f12', display: 'block', fontSize: '8.5px' }}>Sponsor Revenue Share</span>
                                <strong style={{ fontSize: '11px', color: '#15803d' }}>70% (₹{sponsorShare}/hr)</strong>
                            </div>
                            <div>
                                <span style={{ color: '#713f12', display: 'block', fontSize: '8.5px' }}>Platform Fee</span>
                                <strong>30% Management</strong>
                            </div>
                            <div>
                                <span style={{ color: '#713f12', display: 'block', fontSize: '8.5px' }}>Settlement Cycle</span>
                                <strong>Weekly Auto-Transfer</strong>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4. TERMS AND COVENANTS */}
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px 12px', background: '#f8fafc', marginBottom: '14px' }}>
                    <div style={{ fontWeight: 800, fontSize: '10px', color: '#0f172a', marginBottom: '6px', textTransform: 'uppercase' }}>
                        ⚖️ Key Legal Terms & Partnership Covenants
                    </div>
                    <ol style={{ margin: 0, paddingLeft: '14px', fontSize: '9px', color: '#334155', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <li><strong>Custody & Platform Deployment:</strong> Sponsor grants RentHub exclusive operational license to deploy the vehicle in verified municipal rides.</li>
                        <li><strong>Mandatory GPS Telemetry:</strong> RentHub will fit an AIS-140 anti-theft GPS tracker and remote engine immobilizer for continuous 24x7 tracking.</li>
                        <li><strong>Insurance & Zero-Liability Cover:</strong> All rides are insured under RentHub's master transit insurance policy. Sponsor holds zero financial liability for rider traffic violations or transit damage.</li>
                        <li><strong>Maintenance & Roadworthiness:</strong> RentHub performs pre-rental diagnostic checks. Sponsor agrees to routine engine servicing based on fleet utilization milestones.</li>
                        <li><strong>Weekly Automated Payouts:</strong> Net 70% earnings accrue in real-time and are disbursed directly to the sponsor's verified bank account every Monday.</li>
                        <li><strong>Term & Withdrawal:</strong> This agreement is valid for 12 months with mutual renewal. Sponsor may request vehicle retrieval with a 30-day notice period.</li>
                    </ol>
                </div>
            </div>

            {/* 5. SIGNATURE & STAMP BLOCK */}
            <div style={{ borderTop: '2px dashed #cbd5e1', paddingTop: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    {/* Left: RentHub Signatory */}
                    <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '10px 12px', background: '#ffffff', position: 'relative' }}>
                        <div style={{ fontSize: '9px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '4px' }}>
                            For RentHub Technologies Pvt. Ltd.
                        </div>
                        <div style={{ height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ fontFamily: "'Brush Script MT', cursive, sans-serif", fontSize: '20px', color: '#4338ca' }}>
                                Authorized Officer
                            </div>
                            {/* Seal Stamp */}
                            <div style={{ border: '1.5px solid #4338ca', color: '#4338ca', padding: '2px 6px', borderRadius: '6px', fontSize: '7.5px', fontWeight: 900, textTransform: 'uppercase', transform: 'rotate(-5deg)' }}>
                                ✓ DIGITALLY SEALED
                            </div>
                        </div>
                        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '4px', fontSize: '8.5px', color: '#64748b' }}>
                            Authorized Legal Signatory | Bangalore Corporate Desk
                        </div>
                    </div>

                    {/* Right: Sponsor Signature */}
                    <div style={{ border: '1.5px solid #a855f7', borderRadius: '8px', padding: '10px 12px', background: '#faf5ff' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <span style={{ fontSize: '9px', fontWeight: 800, color: '#6b21a8', textTransform: 'uppercase' }}>
                                Vehicle Owner / Sponsor Signature
                            </span>
                            <span style={{ fontSize: '8px', color: '#7e22ce', fontWeight: 700 }}>* Sign Below</span>
                        </div>
                        <div style={{ height: '36px', display: 'flex', alignItems: 'flex-end', borderBottom: '1px solid #cbd5e1', marginBottom: '4px', paddingBottom: '2px' }}>
                            <span style={{ fontSize: '9px', color: '#94a3b8', fontStyle: 'italic' }}>
                                (Sign or paste physical/digital signature here)
                            </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8.5px', color: '#475569' }}>
                            <span>Name: <strong>{sponsorName}</strong></span>
                            <span>Date: <strong>{contractDate}</strong></span>
                        </div>
                    </div>
                </div>

                {/* Footer Note */}
                <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '8px', color: '#94a3b8' }}>
                    © {new Date().getFullYear()} RentHub Technologies Private Limited. All Rights Reserved. This document constitutes a legally binding agreement.
                </div>
            </div>
        </div>
    );
});

export default ContractDocument;
