import { PDFDocument, rgb, StandardFonts, PDFFont } from 'pdf-lib';
import { Client, Mandat, Invoice, InvoiceItem, CompanySettings } from '@/types/database';
import { formatCurrency, DEFAULT_TVA_RATE } from './invoiceHelpers';
import fs from 'fs';
import path from 'path';

interface InvoiceData {
  invoice: Invoice;
  client: Client;
  mandat?: Mandat | null;
  items: InvoiceItem[];
  companySettings: CompanySettings;
}

export async function generateInvoicePDF(data: InvoiceData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4
  const { width, height } = page.getSize();
  
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontNormal = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const settings = data.companySettings;
  
  // =========================
  // Couleurs & marges
  // =========================
  const blue = rgb(0, 0.4, 0.8);
  const black = rgb(0, 0, 0);
  const lightGray = rgb(0.96, 0.96, 0.96);
  const white = rgb(1, 1, 1);

  const ml = 70; // marge gauche
  const mt = 30; // marge haut
  const mr = 40; // marge droite
  const mb = 70; // marge bas
  const contentWidth = width - ml - mr;

  const fmtDate = (d: Date) => {
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    return `${day}.${month}.${d.getFullYear()}`;
  };

  const rightAlign = (
    text: string,
    x: number,
    y: number,
    size: number,
    font: PDFFont
  ) => {
    const w = font.widthOfTextAtSize(text, size);
    page.drawText(text, { x: x - w, y, size, font, color: black });
  };

  const creditorName = settings.represented_by || settings.agency_name || 'Mohamad Hawaley';
  const ibanToDisplay = settings.qr_iban || settings.iban;

  // =========================
  // Logo & bloc émetteur
  // =========================
  let logoImage;
  try {
    const logoPath = path.join(process.cwd(), 'public', 'images', 'urstory_black.png');
    const logoBytes = fs.readFileSync(logoPath);
    logoImage = await pdfDoc.embedPng(logoBytes);
  } catch {
    // logo optionnel
  }

  let emitterY: number;

  if (logoImage) {
    // on fixe une taille max propre pour le logo
    const maxLogoWidth = 80;
    const maxLogoHeight = 45;
    const logoDims = logoImage.scaleToFit(maxLogoWidth, maxLogoHeight); // pdf-lib: scaleToFit :contentReference[oaicite:2]{index=2}

    // on aligne le haut du logo avec le haut de la page (marge incluse),
    // comme le bloc "FACTURE" à droite
    const logoTop = height - mt;
    const logoY = logoTop - logoDims.height;

    page.drawImage(logoImage, {
      x: ml,
      y: logoY,
      width: logoDims.width,
      height: logoDims.height,
    });

    // le texte commence un peu sous le logo
    emitterY = logoY - 18;
  } else {
    emitterY = height - mt - 10;
  }

  // urstory.ch
  page.drawText('urstory.ch', { x: ml, y: emitterY, size: 14, font: fontBold, color: black });
  emitterY -= 18;

  page.drawText(creditorName, { x: ml, y: emitterY, size: 10, font: fontNormal, color: black });
  emitterY -= 13;

  if (settings.address) {
    page.drawText(settings.address, { x: ml, y: emitterY, size: 10, font: fontNormal, color: black });
    emitterY -= 13;
  }

  if (settings.zip_code || settings.city) {
    const cityLine = (settings.zip_code || '') + ' ' + (settings.city || '');
    page.drawText(cityLine.trim(), { x: ml, y: emitterY, size: 10, font: fontNormal, color: black });
    emitterY -= 13;
  }

  if (settings.email) {
    page.drawText(settings.email, { x: ml, y: emitterY, size: 10, font: fontNormal, color: black });
    emitterY -= 13;
  }

  if (settings.phone) {
    page.drawText(settings.phone, { x: ml, y: emitterY, size: 10, font: fontNormal, color: black });
    emitterY -= 13;
  }

  // TVA supprimée - ne plus afficher
  // if (settings.tva_number) {
  //   page.drawText('TVA: ' + settings.tva_number, { x: ml, y: emitterY, size: 10, font: fontNormal, color: black });
  //   emitterY -= 20;
  // }

  emitterY -= 10;

  // =========================
  // Bloc paiement (IBAN)
  // =========================
  const paymentYTop = emitterY;
  const paymentBoxHeight = 80;
  const paymentYBottom = paymentYTop - paymentBoxHeight;

  page.drawRectangle({
    x: ml,
    y: paymentYBottom,
    width: contentWidth * 0.5,
    height: paymentBoxHeight,
    color: lightGray,
  });

  page.drawText('Coordonnées de paiement', {
    x: ml + 10,
    y: paymentYTop - 15,
    size: 13,
    font: fontBold,
    color: black,
  });

  let paymentTextY = paymentYTop - 35;

  if (ibanToDisplay) {
    page.drawText('IBAN:', {
      x: ml + 10,
      y: paymentTextY,
      size: 10,
      font: fontBold,
      color: black,
    });
    page.drawText(ibanToDisplay, {
      x: ml + 10,
      y: paymentTextY - 15,
      size: 12,
      font: fontBold,
      color: black,
    });
    paymentTextY -= 30;

    if (settings.qr_iban) {
      page.drawText('(QR-IBAN)', {
        x: ml + 10,
        y: paymentTextY,
        size: 9,
        font: fontNormal,
        color: black,
      });
      paymentTextY -= 15;
    }
  }

  page.drawText('Titulaire:', {
    x: ml + 10,
    y: paymentTextY,
    size: 10,
    font: fontNormal,
    color: black,
  });
  page.drawText(creditorName, {
    x: ml + 70,
    y: paymentTextY,
    size: 10,
    font: fontNormal,
    color: black,
  });

  // =========================
  // Bloc infos facture (droite)
  // =========================
  const rightX = width - mr;
  let invoiceY = height - mt;

  const factureTitle = 'FACTURE';
  const factureTitleSize = 22;
  const factureTitleWidth = fontBold.widthOfTextAtSize(factureTitle, factureTitleSize);

  // Titre FACTURE parfaitement aligné à droite
  page.drawText(factureTitle, {
    x: rightX - factureTitleWidth,
    y: invoiceY,
    size: factureTitleSize,
    font: fontBold,
    color: black,
  });
  invoiceY -= 35;

  const labelX = rightX - 130;
  const valueX = rightX;

  page.drawText('N° facture', { x: labelX, y: invoiceY, size: 10, font: fontBold, color: black });
  rightAlign(data.invoice.invoice_number, valueX, invoiceY, 11, fontBold);
  invoiceY -= 20;

  page.drawText('Date', { x: labelX, y: invoiceY, size: 10, font: fontNormal, color: black });
  rightAlign(fmtDate(new Date(data.invoice.issue_date)), valueX, invoiceY, 10, fontNormal);
  invoiceY -= 20;

  if (data.invoice.due_date) {
    page.drawText('Date d\'échéance', {
      x: labelX,
      y: invoiceY,
      size: 10,
      font: fontNormal,
      color: black,
    });
    rightAlign(fmtDate(new Date(data.invoice.due_date)), valueX, invoiceY, 10, fontNormal);
    invoiceY -= 20;
  }

  page.drawText('N° client', { x: labelX, y: invoiceY, size: 10, font: fontNormal, color: black });
  rightAlign(data.client.id.toString().padStart(4, '0'), valueX, invoiceY, 10, fontNormal);

  // =========================
  // Bloc client (“Facturer à”)
  // =========================
  let clientY = paymentYBottom - 40; // un peu plus d’air sous le bloc gris

  page.drawText('Facturé à', { x: ml, y: clientY, size: 13, font: fontBold, color: black });
  clientY -= 18;

  const clientName = data.client.company_name || data.client.name;
  page.drawText(clientName, { x: ml, y: clientY, size: 11, font: fontBold, color: black });
  clientY -= 15;

  if (data.client.company_name && data.client.name) {
    page.drawText(data.client.name, { x: ml, y: clientY, size: 10, font: fontNormal, color: black });
    clientY -= 14;
  }

  if (data.client.address) {
    page.drawText(data.client.address, { x: ml, y: clientY, size: 10, font: fontNormal, color: black });
    clientY -= 14;
  }

  if (data.client.zip_code || data.client.locality) {
    const loc = (data.client.zip_code || '') + ' ' + (data.client.locality || '');
    page.drawText(loc.trim(), { x: ml, y: clientY, size: 10, font: fontNormal, color: black });
    clientY -= 14;
  }

  if (data.client.represented_by) {
    page.drawText('Représenté par : ' + data.client.represented_by, {
      x: ml,
      y: clientY,
      size: 10,
      font: fontNormal,
      color: black,
    });
    clientY -= 14;
  }

  clientY -= 20; // espace avant tableau

  // =========================
  // Tableau des prestations
  // =========================
  const tableY = clientY;
  const tableEndX = width - mr;

  const col1 = ml;
  const col1Width = contentWidth * 0.5;
  const col2 = col1 + col1Width;
  const col2Width = contentWidth * 0.1;
  const col3 = col2 + col2Width;
  const col3Width = contentWidth * 0.1;
  const col4 = col3 + col3Width;
  const col4Width = contentWidth * 0.15;
  const col5 = tableEndX;

  const headerH = 24;
  page.drawRectangle({
    x: ml,
    y: tableY - headerH,
    width: contentWidth,
    height: headerH,
    color: blue,
  });

  const headerY = tableY - 16;
  page.drawText('Description', { x: col1 + 8, y: headerY, size: 10, font: fontBold, color: white });
  page.drawText('Quantité', { x: col2 + 5, y: headerY, size: 10, font: fontBold, color: white });
  page.drawText('Unité', { x: col3 + 5, y: headerY, size: 10, font: fontBold, color: white });
  page.drawText('Prix unit.', { x: col4 + 5, y: headerY, size: 10, font: fontBold, color: white });

  const montantW = fontBold.widthOfTextAtSize('Montant', 10);
  page.drawText('Montant', {
    x: col5 - montantW - 8,
    y: headerY,
    size: 10,
    font: fontBold,
    color: white,
  });

  page.drawLine({
    start: { x: ml, y: tableY - headerH },
    end: { x: tableEndX, y: tableY - headerH },
    thickness: 1,
    color: white,
  });

  let rowY = tableY - headerH - 12;

  // Fonction pour découper le texte en lignes selon une largeur max
  const wrapText = (text: string, maxWidth: number, font: PDFFont, fontSize: number): string[] => {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = font.widthOfTextAtSize(testLine, fontSize);
      
      if (testWidth > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }
    return lines;
  };

  const descMaxWidth = col1Width - 16; // largeur max pour la description (avec marges)

  data.items.forEach((item) => {
    if (rowY < mb + 80) return;

    // Découper la description en lignes si nécessaire
    const descLines = wrapText(item.description, descMaxWidth, fontNormal, 10);
    const lineY = rowY - 12;

    // Dessiner chaque ligne de description
    descLines.forEach((line, idx) => {
      page.drawText(line, { 
        x: col1 + 8, 
        y: lineY - (idx * 12), 
        size: 10, 
        font: fontNormal, 
        color: black 
      });
    });

    // quantité à droite (alignée avec la première ligne)
    const qtyStr = item.quantity.toFixed(2);
    const qtyW = fontNormal.widthOfTextAtSize(qtyStr, 10);
    page.drawText(qtyStr, {
      x: col2 + col2Width - qtyW - 5,
      y: lineY,
      size: 10,
      font: fontNormal,
      color: black,
    });

    // unité
    page.drawText('pc.', { x: col3 + 5, y: lineY, size: 10, font: fontNormal, color: black });

    // prix unitaire à droite
    const unitStr = formatCurrency(item.unit_price);
    const unitW = fontNormal.widthOfTextAtSize(unitStr, 10);
    page.drawText(unitStr, {
      x: col4 + col4Width - unitW - 8,
      y: lineY,
      size: 10,
      font: fontNormal,
      color: black,
    });

    // montant à droite
    const amountStr = formatCurrency(item.total);
    const amountW2 = fontNormal.widthOfTextAtSize(amountStr, 10);
    page.drawText(amountStr, {
      x: col5 - amountW2 - 8,
      y: lineY,
      size: 10,
      font: fontNormal,
      color: black,
    });

    // Ajuster l'espacement selon le nombre de lignes de description
    const rowHeight = Math.max(26, 14 + (descLines.length * 12));
    rowY -= rowHeight;
  });

  // =========================
  // Sous-total / TVA / Total
  // =========================
  const totalsX = col4;
  let totalsY = rowY - 22;

  page.drawLine({
    start: { x: totalsX, y: totalsY + 18 },
    end: { x: tableEndX, y: totalsY + 18 },
    thickness: 0.5,
    color: black,
  });

  page.drawText('Sous-total', { x: totalsX, y: totalsY, size: 10, font: fontBold, color: black });
  const htStr = formatCurrency(data.invoice.total_ht);
  const htW = fontBold.widthOfTextAtSize(htStr, 10);
  page.drawText(htStr, { x: col5 - htW - 8, y: totalsY, size: 10, font: fontBold, color: black });
  totalsY -= 18;

  // Déterminer si la TVA est applicable (basé sur le montant stocké)
  const tvaApplicable = data.invoice.total_tva > 0;
  const tvaLabel = tvaApplicable 
    ? 'TVA ' + (DEFAULT_TVA_RATE * 100).toFixed(1) + '%'
    : 'TVA (exonéré)';
  page.drawText(tvaLabel, { x: totalsX, y: totalsY, size: 10, font: fontNormal, color: black });
  const tvaStr = tvaApplicable ? formatCurrency(data.invoice.total_tva) : 'CHF 0.00';
  const tvaW = fontNormal.widthOfTextAtSize(tvaStr, 10);
  page.drawText(tvaStr, { x: col5 - tvaW - 8, y: totalsY, size: 10, font: fontNormal, color: black });
  totalsY -= 18;

  // petite ligne de séparation avant le total
  page.drawLine({
    start: { x: totalsX, y: totalsY + 12 },
    end: { x: tableEndX, y: totalsY + 12 },
    thickness: 1,
    color: black,
  });

  const totalBoxW = tableEndX - totalsX + 10;
  const totalBoxH = 26; // un peu plus compact
  page.drawRectangle({
    x: totalsX - 5,
    y: totalsY - totalBoxH + 10,
    width: totalBoxW,
    height: totalBoxH,
    color: blue,
  });

  const ttcStr = formatCurrency(data.invoice.total_ttc);
  page.drawText('TOTAL', {
    x: totalsX,
    y: totalsY - 7,
    size: 15,
    font: fontBold,
    color: white,
  });
  const ttcW = fontBold.widthOfTextAtSize(ttcStr, 15);
  page.drawText(ttcStr, {
    x: col5 - ttcW - 8,
    y: totalsY - 7,
    size: 15,
    font: fontBold,
    color: white,
  });

  // =========================
  // Pied de page
  // =========================
  const footerText = tvaApplicable 
    ? 'Tous les montants sont indiqués en CHF. Merci pour votre confiance.'
    : 'Exonéré de TVA selon art. 10 al. 2 let. a LTVA (CA < CHF 100\'000). Montants en CHF.';
  const footerSize = 8;
  page.drawText(footerText, {
    x: ml,
    y: mb + 12,
    size: footerSize,
    font: fontNormal,
    color: black,
  });

  page.drawText('Page 1', {
    x: width - mr - 30,
    y: mb,
    size: 8,
    font: fontNormal,
    color: black,
  });

  return await pdfDoc.save();
}
