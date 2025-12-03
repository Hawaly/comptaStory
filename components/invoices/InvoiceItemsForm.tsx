"use client";

import { Plus, Trash2 } from "lucide-react";
import { InvoiceItemInsert } from "@/types/database";
import { formatCurrency } from "@/lib/invoiceHelpers";

interface InvoiceItemsFormProps {
  items: Omit<InvoiceItemInsert, 'invoice_id'>[];
  onChange: (items: Omit<InvoiceItemInsert, 'invoice_id'>[]) => void;
}

export function InvoiceItemsForm({ items, onChange }: InvoiceItemsFormProps) {
  const handleAddLine = () => {
    onChange([
      ...items,
      {
        description: "",
        quantity: 1,
        unit_price: 0,
        total: 0,
      },
    ]);
  };

  const handleRemoveLine = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    onChange(newItems);
  };

  const handleItemChange = (
    index: number,
    field: keyof Omit<InvoiceItemInsert, 'invoice_id'>,
    value: string | number
  ) => {
    const newItems = [...items];
    const item = { ...newItems[index] };

    if (field === 'description') {
      item[field] = value as string;
    } else {
      const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
      item[field] = numValue;
      
      // Recalculer le total de la ligne
      if (field === 'quantity' || field === 'unit_price') {
        item.total = item.quantity * item.unit_price;
      }
    }

    newItems[index] = item;
    onChange(newItems);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
        <h3 className="text-lg font-bold text-gray-900">
          Lignes de facturation
        </h3>
        <button
          type="button"
          onClick={handleAddLine}
          className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-bold"
        >
          <Plus className="w-4 h-4" />
          <span>Ajouter une ligne</span>
        </button>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-gray-200">
          <p className="text-gray-900 font-semibold">
            Aucune ligne. Cliquez sur &quot;Ajouter une ligne&quot; pour commencer.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => (
            <div
              key={index}
              className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200"
            >
              <div className="grid grid-cols-12 gap-2 sm:gap-3 items-start">
                {/* Description */}
                <div className="col-span-12 lg:col-span-5">
                  <label className="block text-xs font-bold text-gray-900 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium"
                    placeholder="Description de la prestation"
                    required
                  />
                </div>

                {/* Quantité */}
                <div className="col-span-6 sm:col-span-4 lg:col-span-2">
                  <label className="block text-xs font-bold text-gray-900 mb-1">
                    Qté
                  </label>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-bold"
                    required
                  />
                </div>

                {/* Prix unitaire */}
                <div className="col-span-6 sm:col-span-4 lg:col-span-2">
                  <label className="block text-xs font-bold text-gray-900 mb-1">
                    Prix unit. (CHF)
                  </label>
                  <input
                    type="number"
                    value={item.unit_price}
                    onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-bold"
                    required
                  />
                </div>

                {/* Total */}
                <div className="col-span-10 sm:col-span-3 lg:col-span-2">
                  <label className="block text-xs font-bold text-gray-900 mb-1">
                    Total
                  </label>
                  <div className="px-3 py-2 bg-blue-50 border-2 border-blue-300 rounded-lg font-black text-gray-900">
                    {formatCurrency(item.total)}
                  </div>
                </div>

                {/* Bouton supprimer */}
                <div className="col-span-2 sm:col-span-1 flex items-end justify-end">
                  <button
                    type="button"
                    onClick={() => handleRemoveLine(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Supprimer cette ligne"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

