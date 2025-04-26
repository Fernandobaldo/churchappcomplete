import React from 'react'
import { BaseToast, ErrorToast } from 'react-native-toast-message'

export const toastConfig = {
    success: (props: any) => (
        <BaseToast
            {...props}
    style={{
    borderLeftColor: '#4CAF50',
        backgroundColor: '#E8F5E9',
        borderRadius: 10,
}}
text1Style={{
    fontSize: 16,
        fontWeight: 'bold',
        color: '#2E7D32',
}}
text2Style={{
    fontSize: 14,
        color: '#2E7D32',
}}
/>
),
error: (props: any) => (
    <ErrorToast
        {...props}
style={{
    borderLeftColor: '#F44336',
        backgroundColor: '#FFEBEE',
        borderRadius: 10,
}}
text1Style={{
    fontSize: 16,
        fontWeight: 'bold',
        color: '#C62828',
}}
text2Style={{
    fontSize: 14,
        color: '#C62828',
}}
/>
),
}
