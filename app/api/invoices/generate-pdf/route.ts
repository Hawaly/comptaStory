import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { generateInvoicePDF } from '@/lib/invoicePdfGenerator';
import { getCompanySettings } from '@/lib/companySettings';
import { saveInvoice } from '@/lib/storageHelpers';
import { Client, Mandat, Invoice, InvoiceItem } from '@/types/database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { invoice_id } = body;

    if (!invoice_id) {
      return NextResponse.json(
        { error: 'Invoice ID requis' },
        { status: 400 }
      );
    }

    // Récupérer la facture avec ses relations
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoice')
      .select(`
        *,
        client:client_id (*),
        mandat:mandat_id (*)
      `)
      .eq('id', invoice_id)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json(
        { error: 'Facture non trouvée' },
        { status: 404 }
      );
    }

    // Récupérer les lignes
    const { data: items, error: itemsError } = await supabase
      .from('invoice_item')
      .select('*')
      .eq('invoice_id', invoice_id)
      .order('id');

    if (itemsError) {
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des lignes' },
        { status: 500 }
      );
    }

    // Récupérer les paramètres de l'agence
    const companySettings = await getCompanySettings();

    // Générer le PDF
    const pdfBytes = await generateInvoicePDF({
      invoice: invoice as Invoice,
      client: invoice.client as Client,
      mandat: invoice.mandat as Mandat | null,
      items: items as InvoiceItem[],
      companySettings,
    });

    // Sauvegarder le PDF (local en dev, Supabase en prod)
    console.log('[PDF Generation] Saving PDF for:', invoice.invoice_number);
    
    const storagePath = await saveInvoice(invoice.invoice_number, pdfBytes);
    
    console.log('[PDF Generation] Saved to:', storagePath);

    // Mettre à jour la facture avec le chemin du PDF
    const { error: updateError } = await supabase
      .from('invoice')
      .update({ pdf_path: storagePath })
      .eq('id', invoice_id);

    if (updateError) {
      throw new Error(`Erreur mise à jour: ${updateError.message}`);
    }

    return NextResponse.json({
      success: true,
      pdf_path: storagePath,
      message: 'PDF généré avec succès',
    });

  } catch (error: unknown) {
    const err = error as Error;
    console.error('Erreur génération PDF facture:', err);
    return NextResponse.json(
      { error: err.message || 'Erreur lors de la génération du PDF' },
      { status: 500 }
    );
  }
}

