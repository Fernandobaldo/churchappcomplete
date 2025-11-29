import PDFDocument from 'pdfkit';
import { generateQRCodeDataURL } from './qrCodeService';
/**
 * Gera um PDF com QR code e informações do link de convite
 */
export async function generateInviteLinkPDF(linkData) {
    return new Promise(async (resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: 'A4',
                margins: { top: 50, bottom: 50, left: 50, right: 50 },
            });
            const buffers = [];
            doc.on('data', (chunk) => buffers.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', reject);
            // Título
            doc.fontSize(24).text('Convite para Registro', { align: 'center' });
            doc.moveDown();
            // Informações da Igreja
            doc.fontSize(16).text('Igreja:', { continued: true }).fontSize(12).text(linkData.churchName);
            doc.fontSize(16).text('Filial:', { continued: true }).fontSize(12).text(linkData.branchName);
            doc.moveDown();
            // QR Code
            const qrCodeDataURL = await generateQRCodeDataURL(linkData.inviteUrl);
            const qrCodeBase64 = qrCodeDataURL.split(',')[1];
            const qrCodeBuffer = Buffer.from(qrCodeBase64, 'base64');
            doc.image(qrCodeBuffer, {
                fit: [200, 200],
                align: 'center',
            });
            doc.moveDown(0.5);
            // Texto abaixo do QR code
            doc.fontSize(12).text('Link convite para entrar no app da igreja', { align: 'center' });
            doc.moveDown();
            // Link
            doc.fontSize(12).text('Link de registro:', { align: 'center' });
            doc.fontSize(10).text(linkData.inviteUrl, { align: 'center', link: linkData.inviteUrl });
            doc.moveDown();
            // Informações do link
            doc.fontSize(10);
            if (linkData.expiresAt) {
                doc.text(`Expira em: ${linkData.expiresAt.toLocaleDateString('pt-BR')}`, { align: 'center' });
            }
            if (linkData.maxUses !== null && linkData.maxUses !== undefined) {
                doc.text(`Usos: ${linkData.currentUses} / ${linkData.maxUses}`, { align: 'center' });
            }
            else {
                doc.text(`Usos: ${linkData.currentUses} (ilimitado)`, { align: 'center' });
            }
            doc.end();
        }
        catch (error) {
            reject(new Error(`Erro ao gerar PDF: ${error instanceof Error ? error.message : 'Erro desconhecido'}`));
        }
    });
}
