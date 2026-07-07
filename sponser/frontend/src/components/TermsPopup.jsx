import React from 'react';
import { ShieldCheck, X } from 'lucide-react';


const TermsPopup = ({ isOpen, onClose, onAccept }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-scale-in">

                {/* Header */}
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Terms & Conditions</h2>
                            <p className="text-xs text-gray-500">Please read carefully before accepting</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content - Scrollable */}
                <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50">
                    <div className="prose prose-sm max-w-none">
                        {/* Embedding the TermsContent directly or reusable component without the full page layout */}
                        <TermsContent />
                    </div>
                </div>

                {/* Footer - Actions */}
                <div className="p-4 border-t border-gray-100 bg-white flex items-center justify-end gap-3 shrink-0">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl text-gray-600 font-semibold hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200"
                    >
                        Decline
                    </button>
                    <button
                        onClick={() => {
                            onAccept();
                            onClose();
                        }}
                        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-[1.02] transition-all active:scale-[0.98]"
                    >
                        Accept & Continue
                    </button>
                </div>
            </div>
        </div>
    );
};

// Reusing content from TermsConditions page but stripped of page layout
const TermsContent = () => (
    <div className="space-y-6">
        <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 mb-6">
            <p className="text-gray-700 text-sm leading-relaxed">
                Welcome to the RentHub Sponsor Program. By listing your vehicle on our platform, you agree to the following terms and conditions. These terms ensure a safe, transparent, and profitable experience for all parties involved.
            </p>
        </div>

        <Section title="1. Vehicle Eligibility & Listing">
            <ul className="list-disc pl-5 space-y-1 text-gray-600 text-sm">
                <li>All vehicles must be registered, insured, and in good working condition.</li>
                <li>Sponsors must provide accurate details, photos, and documentation (RC, Insurance, PUC).</li>
                <li>RentHub reserves the right to reject or delist vehicles that do not meet standards.</li>
            </ul>
        </Section>

        <Section title="2. Earnings & Payouts">
            <ul className="list-disc pl-5 space-y-1 text-gray-600 text-sm">
                <li>Sponsors earn <strong>70%</strong> of total booking revenue. RentHub retains a <strong>30%</strong> service fee.</li>
                <li>Payouts are processed daily/weekly upon request.</li>
                <li>Earnings are calculated based on completed rides only.</li>
            </ul>
        </Section>

        <Section title="3. Maintenance & Damages">
            <ul className="list-disc pl-5 space-y-1 text-gray-600 text-sm">
                <li>Sponsors are responsible for general maintenance.</li>
                <li>RentHub facilitates damage recovery but the Sponsor is responsible for the vehicle's condition.</li>
                <li>Minor wear and tear is not covered.</li>
            </ul>
        </Section>

        <Section title="4. Sponsor Responsibilities">
            <ul className="list-disc pl-5 space-y-1 text-gray-600 text-sm">
                <li>Ensure sufficient fuel/charge before bookings.</li>
                <li>Prompt handover of keys and documents.</li>
                <li>No use of vehicles for illegal activities.</li>
            </ul>
        </Section>
    </div>
);

const Section = ({ title, children }) => (
    <div className="mb-4">
        <h3 className="font-bold text-gray-800 mb-2 text-base">{title}</h3>
        {children}
    </div>
);

export default TermsPopup;
