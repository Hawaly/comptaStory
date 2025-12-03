import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { getDownloadUrl } from '@/lib/storageHelpers';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const invoiceId = params.id;

    const { data: invoice, error: invoiceError } = await supabase
      .from('invoice')
      .select('*')
      .eq('id', invoiceId)
      .single();

    if (invoiceError || !invoice || !invoice.pdf_path) {
      return NextResponse.json(
        { error: 'Facture ou PDF non trouvé' },
        { status: 404 }
      );
    }

    // Get the download URL (signed URL for Supabase, local path for dev)
    const downloadUrl = await getDownloadUrl(invoice.pdf_path);
    
    // NextResponse.redirect requires an absolute URL
    // If it's a relative path, convert to absolute using the request origin
    if (downloadUrl.startsWith('/')) {
      const absoluteUrl = new URL(downloadUrl, request.url);
      return NextResponse.redirect(absoluteUrl);
    }
    
    return NextResponse.redirect(downloadUrl);

  } catch (error: unknown) {
    const err = error as Error;
    console.error('Erreur téléchargement facture:', err);
    return NextResponse.json(
      { error: err.message || 'Erreur lors du téléchargement' },
      { status: 500 }
    );
  }
}

