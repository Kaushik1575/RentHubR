import { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Camera, Save, Edit2, Copy, Check } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const Profile = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        address: ''
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await api.get('/sponsor/profile');
            const userData = response.data?.sponsor || response.data;
            setUser(userData);
            setFormData({
                fullName: userData.fullName || userData.full_name || '',
                email: userData.email || '',
                phone: userData.phone || userData.phoneNumber || userData.phone_number || '',
                address: userData.address || ''
            });
        } catch (error) {
            console.error("Failed to fetch profile", error);
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                const userData = JSON.parse(storedUser);
                setUser(userData);
                setFormData({
                    fullName: userData.fullName || userData.full_name || '',
                    email: userData.email || '',
                    phone: userData.phone || userData.phoneNumber || userData.phone_number || '',
                    address: userData.address || ''
                });
            }
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleProfilePictureUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image size should be less than 5MB');
            return;
        }

        setUploading(true);
        const formDataUpload = new FormData();
        formDataUpload.append('profilePicture', file);

        try {
            const response = await api.post('/sponsor/profile-picture', formDataUpload, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            toast.success('Profile picture updated successfully!');
            const updatedUser = response.data.sponsor;
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
        } catch (error) {
            console.error('Error uploading profile picture:', error);
            toast.error(error.response?.data?.error || 'Failed to upload profile picture');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await api.put('/sponsor/profile', formData);
            toast.success('Profile updated successfully!');
            setUser(response.data.sponsor || response.data);
            setIsEditing(false);

            const updatedUser = response.data.sponsor || response.data;
            localStorage.setItem('user', JSON.stringify(updatedUser));
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error(error.response?.data?.error || 'Failed to update profile');
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(user.id);
        setCopied(true);
        toast.success('Sponsor ID copied!');
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
                background: '#f8f9fa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: '60px',
                        height: '60px',
                        border: '4px solid white',
                        borderTopColor: 'transparent',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 20px'
                    }}></div>
                    <p style={{ color: 'white', fontSize: '18px', fontWeight: '500' }}>Loading profile...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div style={{
                minHeight: '100vh',
                background: '#f8f9fa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <div style={{
                    background: 'white',
                    padding: '40px',
                    borderRadius: '20px',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
                }}>
                    <p style={{ color: '#e74c3c', fontSize: '18px', fontWeight: '600' }}>
                        User not found. Please login again.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: '#f8f9fa',
            padding: '40px 20px',
            paddingBottom: '100px'
        }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                {/* Animated Header */}
                <div style={{
                    textAlign: 'center',
                    marginBottom: '40px',
                    animation: 'fadeInDown 0.6s ease-out'
                }}>
                    <h1 style={{
                        fontSize: '42px',
                        fontWeight: '800',
                        color: '#2c3e50',
                        marginBottom: '10px',
                        textShadow: 'none'
                    }}>
                        ✨ My Profile
                    </h1>
                    <p style={{
                        fontSize: '18px',
                        color: '#7f8c8d',
                        fontWeight: '500'
                    }}>
                        Manage your account and personal information
                    </p>
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '30px'
                }}>
                    {/* Profile Card - Colorful Gradient */}
                    <div style={{
                        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                        borderRadius: '24px',
                        padding: '40px',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                        position: 'relative',
                        overflow: 'hidden',
                        animation: 'fadeInLeft 0.6s ease-out'
                    }}>
                        {/* Decorative circles */}
                        <div style={{
                            position: 'absolute',
                            top: '-50px',
                            right: '-50px',
                            width: '200px',
                            height: '200px',
                            background: 'rgba(255,255,255,0.1)',
                            borderRadius: '50%'
                        }}></div>
                        <div style={{
                            position: 'absolute',
                            bottom: '-30px',
                            left: '-30px',
                            width: '150px',
                            height: '150px',
                            background: 'rgba(255,255,255,0.1)',
                            borderRadius: '50%'
                        }}></div>

                        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                            {/* Profile Picture */}
                            <input
                                type="file"
                                id="profilePictureInput"
                                accept="image/*"
                                onChange={handleProfilePictureUpload}
                                style={{ display: 'none' }}
                            />

                            <div style={{ position: 'relative', display: 'inline-block', marginBottom: '20px' }}>
                                <div
                                    onClick={() => !uploading && document.getElementById('profilePictureInput').click()}
                                    style={{
                                        width: '150px',
                                        height: '150px',
                                        borderRadius: '50%',
                                        background: user?.profile_picture
                                            ? `url(${user.profile_picture}) center/cover`
                                            : 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '60px',
                                        fontWeight: 'bold',
                                        color: '#fff',
                                        cursor: uploading ? 'wait' : 'pointer',
                                        border: '6px solid white',
                                        boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
                                        transition: 'transform 0.3s, box-shadow 0.3s',
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!uploading) {
                                            e.currentTarget.style.transform = 'scale(1.05)';
                                            e.currentTarget.style.boxShadow = '0 15px 50px rgba(0,0,0,0.4)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!uploading) {
                                            e.currentTarget.style.transform = 'scale(1)';
                                            e.currentTarget.style.boxShadow = '0 10px 40px rgba(0,0,0,0.3)';
                                        }
                                    }}
                                >
                                    {uploading ? (
                                        <div style={{
                                            position: 'absolute',
                                            inset: 0,
                                            background: 'rgba(0,0,0,0.6)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexDirection: 'column',
                                            gap: '10px'
                                        }}>
                                            <div style={{
                                                width: '40px',
                                                height: '40px',
                                                border: '4px solid white',
                                                borderTopColor: 'transparent',
                                                borderRadius: '50%',
                                                animation: 'spin 1s linear infinite'
                                            }}></div>
                                            <span style={{ fontSize: '14px', fontWeight: '600' }}>Uploading...</span>
                                        </div>
                                    ) : !user?.profile_picture && (
                                        formData.fullName?.charAt(0)?.toUpperCase() || 'S'
                                    )}
                                </div>

                                <button
                                    onClick={() => !uploading && document.getElementById('profilePictureInput').click()}
                                    disabled={uploading}
                                    style={{
                                        position: 'absolute',
                                        bottom: '5px',
                                        right: '5px',
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        color: 'white',
                                        border: '3px solid white',
                                        borderRadius: '50%',
                                        width: '45px',
                                        height: '45px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: uploading ? 'wait' : 'pointer',
                                        boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                                        transition: 'transform 0.2s'
                                    }}
                                    onMouseEnter={(e) => !uploading && (e.currentTarget.style.transform = 'scale(1.1)')}
                                    onMouseLeave={(e) => !uploading && (e.currentTarget.style.transform = 'scale(1)')}
                                >
                                    <Camera size={20} />
                                </button>
                            </div>

                            <h2 style={{
                                fontSize: '28px',
                                fontWeight: '700',
                                color: 'white',
                                marginBottom: '8px',
                                textShadow: '0 2px 10px rgba(0,0,0,0.2)'
                            }}>
                                {formData.fullName}
                            </h2>
                            <p style={{
                                fontSize: '16px',
                                color: 'rgba(255,255,255,0.9)',
                                marginBottom: '25px'
                            }}>
                                {formData.email}
                            </p>

                            {/* Sponsor ID Card */}
                            <div style={{
                                background: 'rgba(255,255,255,0.2)',
                                backdropFilter: 'blur(10px)',
                                borderRadius: '16px',
                                padding: '20px',
                                border: '2px solid rgba(255,255,255,0.3)'
                            }}>
                                <div style={{
                                    fontSize: '12px',
                                    color: 'rgba(255,255,255,0.8)',
                                    marginBottom: '8px',
                                    fontWeight: '600',
                                    textTransform: 'uppercase',
                                    letterSpacing: '1px'
                                }}>
                                    Sponsor ID
                                </div>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '10px'
                                }}>
                                    <code style={{
                                        fontSize: '13px',
                                        background: 'rgba(255,255,255,0.3)',
                                        padding: '8px 12px',
                                        borderRadius: '8px',
                                        color: 'white',
                                        fontWeight: '600',
                                        fontFamily: 'monospace'
                                    }}>
                                        {user.id?.substring(0, 12)}...
                                    </code>
                                    <button
                                        onClick={copyToClipboard}
                                        style={{
                                            background: copied ? '#2ecc71' : 'rgba(255,255,255,0.3)',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '8px',
                                            padding: '8px 12px',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '5px',
                                            fontWeight: '600',
                                            fontSize: '13px'
                                        }}
                                    >
                                        {copied ? <Check size={16} /> : <Copy size={16} />}
                                        {copied ? 'Copied!' : 'Copy'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Information Card - Colorful Gradient */}
                    <div style={{
                        background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                        borderRadius: '24px',
                        padding: '40px',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                        position: 'relative',
                        overflow: 'hidden',
                        animation: 'fadeInRight 0.6s ease-out'
                    }}>
                        {/* Decorative elements */}
                        <div style={{
                            position: 'absolute',
                            top: '-40px',
                            left: '-40px',
                            width: '180px',
                            height: '180px',
                            background: 'rgba(255,255,255,0.1)',
                            borderRadius: '50%'
                        }}></div>

                        <div style={{ position: 'relative', zIndex: 1 }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginBottom: '30px'
                            }}>
                                <h3 style={{
                                    fontSize: '24px',
                                    fontWeight: '700',
                                    color: 'white',
                                    textShadow: '0 2px 10px rgba(0,0,0,0.2)'
                                }}>
                                    📋 Profile Information
                                </h3>
                                {!isEditing && (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        style={{
                                            background: 'rgba(255,255,255,0.3)',
                                            backdropFilter: 'blur(10px)',
                                            color: 'white',
                                            border: '2px solid rgba(255,255,255,0.5)',
                                            borderRadius: '12px',
                                            padding: '10px 20px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            fontWeight: '600',
                                            fontSize: '14px',
                                            transition: 'all 0.3s'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'rgba(255,255,255,0.4)';
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
                                            e.currentTarget.style.transform = 'translateY(0)';
                                        }}
                                    >
                                        <Edit2 size={16} />
                                        Edit Profile
                                    </button>
                                )}
                            </div>

                            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {/* Full Name */}
                                <div>
                                    <label style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        color: 'white',
                                        marginBottom: '10px',
                                        textShadow: '0 1px 3px rgba(0,0,0,0.2)'
                                    }}>
                                        <User size={18} />
                                        Full Name
                                    </label>
                                    <input
                                        type="text"
                                        id="fullName"
                                        value={formData.fullName}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                        style={{
                                            width: '100%',
                                            padding: '14px 18px',
                                            border: isEditing ? '2px solid rgba(255,255,255,0.5)' : '2px solid rgba(255,255,255,0.3)',
                                            borderRadius: '12px',
                                            fontSize: '16px',
                                            background: isEditing ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.6)',
                                            color: '#2c3e50',
                                            fontWeight: '500',
                                            transition: 'all 0.3s',
                                            cursor: isEditing ? 'text' : 'not-allowed'
                                        }}
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                                    {/* Email */}
                                    <div>
                                        <label style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            color: 'white',
                                            marginBottom: '10px',
                                            textShadow: '0 1px 3px rgba(0,0,0,0.2)'
                                        }}>
                                            <Mail size={18} />
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            id="email"
                                            value={formData.email}
                                            disabled={true}
                                            style={{
                                                width: '100%',
                                                padding: '14px 18px',
                                                border: '2px solid rgba(255,255,255,0.3)',
                                                borderRadius: '12px',
                                                fontSize: '16px',
                                                background: 'rgba(255,255,255,0.4)',
                                                color: '#2c3e50',
                                                fontWeight: '500',
                                                cursor: 'not-allowed'
                                            }}
                                        />
                                        <p style={{
                                            fontSize: '12px',
                                            color: 'rgba(255,255,255,0.8)',
                                            marginTop: '6px',
                                            fontWeight: '500'
                                        }}>
                                            🔒 Email cannot be changed
                                        </p>
                                    </div>

                                    {/* Phone */}
                                    <div>
                                        <label style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            color: 'white',
                                            marginBottom: '10px',
                                            textShadow: '0 1px 3px rgba(0,0,0,0.2)'
                                        }}>
                                            <Phone size={18} />
                                            Phone Number
                                        </label>
                                        <input
                                            type="tel"
                                            id="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            disabled={!isEditing}
                                            style={{
                                                width: '100%',
                                                padding: '14px 18px',
                                                border: isEditing ? '2px solid rgba(255,255,255,0.5)' : '2px solid rgba(255,255,255,0.3)',
                                                borderRadius: '12px',
                                                fontSize: '16px',
                                                background: isEditing ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.6)',
                                                color: '#2c3e50',
                                                fontWeight: '500',
                                                transition: 'all 0.3s',
                                                cursor: isEditing ? 'text' : 'not-allowed'
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Address */}
                                <div>
                                    <label style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        color: 'white',
                                        marginBottom: '10px',
                                        textShadow: '0 1px 3px rgba(0,0,0,0.2)'
                                    }}>
                                        <MapPin size={18} />
                                        Residential Address
                                    </label>
                                    <textarea
                                        id="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                        rows="4"
                                        style={{
                                            width: '100%',
                                            padding: '14px 18px',
                                            border: isEditing ? '2px solid rgba(255,255,255,0.5)' : '2px solid rgba(255,255,255,0.3)',
                                            borderRadius: '12px',
                                            fontSize: '16px',
                                            background: isEditing ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.6)',
                                            color: '#2c3e50',
                                            fontWeight: '500',
                                            resize: 'none',
                                            transition: 'all 0.3s',
                                            cursor: isEditing ? 'text' : 'not-allowed',
                                            fontFamily: 'inherit'
                                        }}
                                    />
                                </div>

                                {/* Action Buttons */}
                                {isEditing && (
                                    <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsEditing(false);
                                                setFormData({
                                                    fullName: user.fullName || user.full_name || '',
                                                    email: user.email || '',
                                                    phone: user.phone || user.phoneNumber || user.phone_number || '',
                                                    address: user.address || ''
                                                });
                                            }}
                                            style={{
                                                flex: 1,
                                                padding: '16px',
                                                border: '3px solid white',
                                                background: 'rgba(255,255,255,0.2)',
                                                backdropFilter: 'blur(10px)',
                                                color: 'white',
                                                borderRadius: '14px',
                                                fontSize: '16px',
                                                fontWeight: '700',
                                                cursor: 'pointer',
                                                transition: 'all 0.3s',
                                                textTransform: 'uppercase',
                                                letterSpacing: '1px'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
                                                e.currentTarget.style.transform = 'translateY(-2px)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                                                e.currentTarget.style.transform = 'translateY(0)';
                                            }}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            style={{
                                                flex: 1,
                                                padding: '16px',
                                                border: 'none',
                                                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                                                color: 'white',
                                                borderRadius: '14px',
                                                fontSize: '16px',
                                                fontWeight: '700',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '10px',
                                                boxShadow: '0 8px 25px rgba(245, 87, 108, 0.4)',
                                                transition: 'all 0.3s',
                                                textTransform: 'uppercase',
                                                letterSpacing: '1px'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.transform = 'translateY(-3px)';
                                                e.currentTarget.style.boxShadow = '0 12px 35px rgba(245, 87, 108, 0.5)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.transform = 'translateY(0)';
                                                e.currentTarget.style.boxShadow = '0 8px 25px rgba(245, 87, 108, 0.4)';
                                            }}
                                        >
                                            <Save size={20} />
                                            Save Changes
                                        </button>
                                    </div>
                                )}
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                
                @keyframes fadeInDown {
                    from {
                        opacity: 0;
                        transform: translateY(-30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                @keyframes fadeInLeft {
                    from {
                        opacity: 0;
                        transform: translateX(-30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                
                @keyframes fadeInRight {
                    from {
                        opacity: 0;
                        transform: translateX(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                
                @media (max-width: 768px) {
                    div[style*="gridTemplateColumns"] {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default Profile;
