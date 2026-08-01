import React from 'react';

function FormField({ label, children }) {
    return (
        <div className="form-group">
            <label className="form-label">{label}</label>
            {children}
        </div>
    );
}

export default FormField;
