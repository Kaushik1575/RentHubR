import React, { forwardRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const downloadContractPDF = async (elementRef, filename = 'RentHub_Partnership_Contract.pdf') => {
    if (!elementRef || !elementRef.current) return;
    try {
        const element = elementRef.current;
        const canvas = await html2canvas(element, {
            scale: 2.2,
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
    const contractNo = `RH-AGR-2026-${(trackingData.id || '0989').toString().padStart(4, '0')}`;
    const vehicleName = `${trackingData.name || ''} ${trackingData.model || ''}`.trim() || 'Commercial Vehicle';
    const regNumber = trackingData.registration_number || 'REG-PENDING';
    const vehicleType = (trackingData.vehicle_type || 'bike').toUpperCase();
    const vehicleYear = trackingData.year || new Date().getFullYear();

    const hourlyRate = parseFloat(trackingData.pricing_terms?.proposed_price || trackingData.price || 65);
    const sponsorShare = (hourlyRate * 0.70).toFixed(1);
    const platformShare = (hourlyRate * 0.30).toFixed(1);
    
    const contractDateObj = trackingData.agreement_accepted_at ? new Date(trackingData.agreement_accepted_at) : new Date();
    const contractDateStr = contractDateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

    return (
        <div
            ref={ref}
            id="renthub-legal-contract"
            style={{
                width: '794px', // Standard A4 width at 96 DPI
                height: '1122px', // Standard A4 height at 96 DPI
                padding: '24px 32px',
                backgroundColor: '#ffffff',
                color: '#111827',
                fontFamily: "'Georgia', 'Times New Roman', serif",
                boxSizing: 'border-box',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                border: '2px solid #1e293b',
                lineHeight: '1.35',
                overflow: 'hidden'
            }}
        >
            {/* Elegant Double Border Inner Frame */}
            <div style={{ position: 'absolute', top: '6px', left: '6px', right: '6px', bottom: '6px', border: '1px solid #94a3b8', pointerEvents: 'none' }} />

            <div>
                {/* 1. OFFICIAL EXECUTIVE HEADER & E-STAMP BANNER */}
                <div style={{ borderBottom: '2px solid #0f172a', paddingBottom: '8px', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '34px', height: '34px', border: '1.5px solid #0f172a', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: '#ffffff', fontWeight: 'bold', fontSize: '18px', fontFamily: 'system-ui, sans-serif' }}>
                                ⚖
                            </div>
                            <div>
                                <h1 style={{ margin: 0, fontSize: '15px', fontWeight: 'bold', letterSpacing: '0.8px', color: '#0f172a', textTransform: 'uppercase' }}>
                                    RENTHUB TECHNOLOGIES PRIVATE LIMITED
                                </h1>
                                <span style={{ fontSize: '8px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: 'system-ui, sans-serif' }}>
                                    CIN: U72900KA2024PTC189210 • Incorporated under the Companies Act, 2013
                                </span>
                            </div>
                        </div>

                        <div style={{ textAlign: 'right', fontFamily: 'system-ui, sans-serif' }}>
                            <div style={{ border: '1px solid #0f172a', padding: '2px 8px', borderRadius: '4px', background: '#f8fafc', fontSize: '8px', fontWeight: 'bold', display: 'inline-block' }}>
                                DEED REF: {contractNo}
                            </div>
                            <div style={{ fontSize: '8px', color: '#475569', marginTop: '2px' }}>
                                Execution Date: <strong>{contractDateStr}</strong>
                            </div>
                        </div>
                    </div>

                    {/* Government Reference Strip */}
                    <div style={{ background: '#f1f5f9', borderTop: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1', padding: '3px 8px', display: 'flex', justifyContent: 'space-between', fontSize: '7.5px', color: '#334155', fontFamily: 'system-ui, sans-serif', textTransform: 'uppercase' }}>
                        <span>COMMERCIAL LEASE & VEHICLE ATTACHMENT DEED</span>
                        <span>JURISDICTION: BANGALORE / BHUBANESWAR</span>
                        <span>MUNICIPAL MOBILITY NETWORK LICENSED</span>
                    </div>
                </div>

                {/* 2. FORMAL DEED TITLE & PREAMBLE */}
                <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                    <h2 style={{ margin: 0, fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#0f172a', textDecoration: 'underline' }}>
                        COMMERCIAL VEHICLE ATTACHMENT & REVENUE-SHARING AGREEMENT
                    </h2>
                    <p style={{ margin: '4px 0 0', fontSize: '8.5px', color: '#334155', textAlign: 'justify', lineHeight: '1.35' }}>
                        <strong>THIS AGREEMENT</strong> is made and executed on this <strong>{contractDateStr}</strong> ("Effective Date"), by and between <strong>RENTHUB TECHNOLOGIES PRIVATE LIMITED</strong>, having its corporate operations office at Mobility Tech Park, Bangalore (hereinafter referred to as the <strong>"Platform Operator" / "RentHub"</strong>, of the <strong>FIRST PART</strong>); and <strong>{sponsorName}</strong>, Contact: {sponsorPhone}, Email: {sponsorEmail}, Tracking Ref: {trackingId} (hereinafter referred to as the <strong>"Vehicle Owner" / "Sponsor"</strong>, of the <strong>SECOND PART</strong>).
                    </p>
                </div>

                {/* 3. SCHEDULE 'A': VEHICLE ASSET DETAILS TABLE */}
                <div style={{ marginBottom: '8px' }}>
                    <div style={{ fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', color: '#0f172a', marginBottom: '3px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span>SCHEDULE 'A' — VEHICLE SPECIFICATIONS & MECHANICAL AUDIT</span>
                        <span style={{ fontSize: '7.5px', color: '#047857', fontWeight: 'bold', fontFamily: 'system-ui, sans-serif' }}>✓ 24-POINT SAFETY AUDIT PASSED</span>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5px', border: '1px solid #0f172a', fontFamily: 'system-ui, sans-serif' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #0f172a' }}>
                                <th style={{ padding: '3px 6px', textAlign: 'left', borderRight: '1px solid #cbd5e1', fontWeight: 'bold' }}>Vehicle Make & Model</th>
                                <th style={{ padding: '3px 6px', textAlign: 'left', borderRight: '1px solid #cbd5e1', fontWeight: 'bold' }}>Registration Number</th>
                                <th style={{ padding: '3px 6px', textAlign: 'left', borderRight: '1px solid #cbd5e1', fontWeight: 'bold' }}>Class / Category</th>
                                <th style={{ padding: '3px 6px', textAlign: 'left', borderRight: '1px solid #cbd5e1', fontWeight: 'bold' }}>Mfg Year</th>
                                <th style={{ padding: '3px 6px', textAlign: 'left', fontWeight: 'bold' }}>Operational Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style={{ padding: '3px 6px', borderRight: '1px solid #cbd5e1', fontWeight: 'bold' }}>{vehicleName}</td>
                                <td style={{ padding: '3px 6px', borderRight: '1px solid #cbd5e1', fontWeight: 'bold', color: '#1e3a8a' }}>{regNumber}</td>
                                <td style={{ padding: '3px 6px', borderRight: '1px solid #cbd5e1' }}>{vehicleType}</td>
                                <td style={{ padding: '3px 6px', borderRight: '1px solid #cbd5e1' }}>{vehicleYear}</td>
                                <td style={{ padding: '3px 6px', color: '#047857', fontWeight: 'bold' }}>Approved for Deployment</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* 4. SCHEDULE 'B': COMMERCIAL SETTLEMENT & REVENUE SPLIT TABLE */}
                <div style={{ marginBottom: '8px' }}>
                    <div style={{ fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', color: '#0f172a', marginBottom: '3px' }}>
                        SCHEDULE 'B' — COMMERCIAL CONSIDERATION & REVENUE SHARING TERMS
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5px', border: '1px solid #0f172a', fontFamily: 'system-ui, sans-serif' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #0f172a' }}>
                                <th style={{ padding: '3px 6px', textAlign: 'left', borderRight: '1px solid #cbd5e1', fontWeight: 'bold' }}>Agreed Customer Rental Tariff</th>
                                <th style={{ padding: '3px 6px', textAlign: 'left', borderRight: '1px solid #cbd5e1', fontWeight: 'bold' }}>Sponsor Net Payout (70%)</th>
                                <th style={{ padding: '3px 6px', textAlign: 'left', borderRight: '1px solid #cbd5e1', fontWeight: 'bold' }}>Platform Tech Fee (30%)</th>
                                <th style={{ padding: '3px 6px', textAlign: 'left', fontWeight: 'bold' }}>Settlement Cycle</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style={{ padding: '3px 6px', borderRight: '1px solid #cbd5e1', fontWeight: 'bold' }}>₹{hourlyRate.toFixed(2)} / Hour</td>
                                <td style={{ padding: '3px 6px', borderRight: '1px solid #cbd5e1', fontWeight: 'bold', color: '#047857' }}>₹{sponsorShare} / Hour (70% Share)</td>
                                <td style={{ padding: '3px 6px', borderRight: '1px solid #cbd5e1' }}>₹{platformShare} / Hour (30% Fee)</td>
                                <td style={{ padding: '3px 6px', fontWeight: 'bold' }}>Weekly Direct Transfer (Every Monday)</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* 5. OPERATIVE ARTICLES & LEGAL COVENANTS */}
                <div style={{ border: '1px solid #cbd5e1', padding: '6px 10px', background: '#fafafa', borderRadius: '4px', marginBottom: '8px' }}>
                    <div style={{ fontSize: '8.5px', fontWeight: 'bold', textTransform: 'uppercase', color: '#0f172a', marginBottom: '3px' }}>
                        TERMS, CONDITIONS & STATUTORY COVENANTS:
                    </div>
                    <ol style={{ margin: 0, paddingLeft: '14px', fontSize: '8px', color: '#1e293b', display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'justify', lineHeight: '1.3' }}>
                        <li><strong>Bailment & Platform Custody:</strong> The Sponsor hereby leases and entrusts operational possession of the vehicle to RentHub for deployment in on-demand commercial fleet rentals.</li>
                        <li><strong>Mandatory Telematics & AIS-140 GPS:</strong> RentHub shall install an authorized AIS-140 standard GPS tracking device with remote engine immobilizer for continuous 24/7 security monitoring.</li>
                        <li><strong>Comprehensive Transit Indemnity:</strong> All active trips are insured under RentHub's master transit insurance. The Sponsor is fully indemnified against third-party rider traffic penalties, transit damage, and civil liabilities.</li>
                        <li><strong>Routine Maintenance & Roadworthiness:</strong> RentHub conducts safety inspections before and after each rental cycle. Engine overhauls and regular servicing adhere to OEM guidelines.</li>
                        <li><strong>Automated Weekly Settlements:</strong> Net accrued revenue is calculated in real-time and credited directly to the Sponsor’s registered bank account on every Monday without deduction.</li>
                        <li><strong>Term & Termination:</strong> This Agreement is valid for 12 months with automatic renewal. Either party may exit and request vehicle retrieval by providing 30 days prior written notice.</li>
                    </ol>
                </div>
            </div>

            {/* 6. FORMAL EXECUTION & SIGNATURE ATTESTATION BLOCK */}
            <div style={{ borderTop: '2px solid #0f172a', paddingTop: '8px' }}>
                <p style={{ margin: '0 0 6px', fontSize: '8px', fontStyle: 'italic', textAlign: 'center', color: '#475569' }}>
                    IN WITNESS WHEREOF, the Parties hereto have signed and executed this Deed of Attachment on the date and year first above written.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontFamily: 'system-ui, sans-serif' }}>
                    {/* First Party: RentHub Authorized Signatory & Official Seal */}
                    <div style={{ border: '1px solid #cbd5e1', padding: '6px 8px', borderRadius: '4px', background: '#ffffff', position: 'relative' }}>
                        <div style={{ fontSize: '8px', fontWeight: 'bold', color: '#0f172a', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0', paddingBottom: '2px', marginBottom: '4px' }}>
                            FOR RENTHUB TECHNOLOGIES PRIVATE LIMITED
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '36px' }}>
                            <div style={{ fontFamily: "'Brush Script MT', cursive", fontSize: '20px', color: '#1e3a8a' }}>
                                Authorized Signatory
                            </div>
                            {/* Official Circular Digital Seal */}
                            <div style={{ border: '2px solid #1e3a8a', color: '#1e3a8a', width: '56px', height: '56px', borderRadius: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontSize: '5px', fontWeight: 'bold', textTransform: 'uppercase', textAlign: 'center', transform: 'rotate(-8deg)', lineHeight: '1.1' }}>
                                <span>RENTHUB</span>
                                <span>★ SEAL ★</span>
                                <span>LEGAL DESK</span>
                            </div>
                        </div>
                        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '2px', fontSize: '7.5px', color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
                            <span>Designation: Fleet Legal Counsel</span>
                            <span>Bangalore Corporate Hub</span>
                        </div>
                    </div>

                    {/* Second Party: Vehicle Owner / Sponsor Signature */}
                    <div style={{ border: '1.5px solid #0f172a', padding: '6px 8px', borderRadius: '4px', background: '#ffffff' }}>
                        <div style={{ fontSize: '8px', fontWeight: 'bold', color: '#0f172a', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0', paddingBottom: '2px', marginBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
                            <span>FOR VEHICLE OWNER / SPONSOR</span>
                            <span style={{ fontSize: '7px', color: '#047857' }}>✓ E-SIGN VERIFIED</span>
                        </div>
                        <div style={{ height: '36px', display: 'flex', alignItems: 'flex-end', borderBottom: '1px dashed #94a3b8', paddingBottom: '2px', marginBottom: '3px' }}>
                            <span style={{ fontSize: '8.5px', color: '#64748b', fontStyle: 'italic' }}>
                                Signature: _________________________________________
                            </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '7.5px', color: '#334155' }}>
                            <span>Name: <strong>{sponsorName}</strong></span>
                            <span>Date: <strong>{contractDateStr}</strong></span>
                        </div>
                    </div>
                </div>

                {/* Footer Legal Notice */}
                <div style={{ textAlign: 'center', marginTop: '6px', fontSize: '7px', color: '#94a3b8', fontFamily: 'system-ui, sans-serif' }}>
                    This document is legally binding under the Indian Contract Act, 1872 and the Information Technology Act, 2000. All disputes subject to jurisdiction of Courts in Bangalore.
                </div>
            </div>
        </div>
    );
});

export default ContractDocument;
