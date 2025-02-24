import { json } from '@sveltejs/kit';
import { GEMINI_API_KEY } from '$env/static/private';

export async function POST({ request }) {
    try {
        const { message } = await request.json();
        
        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': GEMINI_API_KEY
            },
            body: JSON.stringify({
                contents: [{
                    role: 'user',
                    parts: [{
                        text: message
                    }]
                }],
                generationConfig: {
                    temperature: 0.8,
                    maxOutputTokens: 2000,
                }
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Gemini API Error:', {
                status: response.status,
                statusText: response.statusText,
                error: data.error
            });
            
            return json({ 
                error: true,
                message: `API 오류: ${data.error?.message || '알 수 없는 오류가 발생했습니다.'}`,
                status: response.status,
                statusText: response.statusText,
                details: {
                    reason: data.error?.details?.[0]?.reason,
                    domain: data.error?.details?.[0]?.domain,
                    metadata: data.error?.details?.[0]?.metadata
                }
            }, { 
                status: response.status 
            });
        }

        if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
            throw new Error('API 응답 형식이 올바르지 않습니다.');
        }

        return json({ response: data.candidates[0].content.parts[0].text });
        
    } catch (error) {
        console.error('Server Error:', error);
        return json({ 
            error: true,
            message: '서버 오류: ' + (error.message || '알 수 없는 오류가 발생했습니다.'),
            details: process.env.NODE_ENV === 'development' ? {
                stack: error.stack,
                name: error.name
            } : undefined
        }, { 
            status: 500 
        });
    }
} 