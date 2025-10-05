import React, { useMemo, useState } from 'react';
import { Removal } from '../../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Truck, Trash2, Download, CheckCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import ConfirmDeliveryModal from '../modals/ConfirmDeliveryModal';

interface ScheduledDeliveryListProps {
    removals: Removal[];
    onCancelDelivery: (removalCode: string) => void;
    onMarkAsDelivered: (removalCode: string, deliveryPerson: string) => void;
}

const ScheduledDeliveryList: React.FC<ScheduledDeliveryListProps> = ({ removals, onCancelDelivery, onMarkAsDelivered }) => {
    const [confirmingDelivery, setConfirmingDelivery] = useState<Removal | null>(null);

    const scheduledDeliveries = useMemo(() => {
        const deliveries = [...removals].sort((a, b) => new Date(a.scheduledDeliveryDate!).getTime() - new Date(b.scheduledDeliveryDate!).getTime());

        const groupedByDate: { [key: string]: Removal[] } = {};
        deliveries.forEach(d => {
            const dateKey = d.scheduledDeliveryDate;
            if (!dateKey) return;
            if (!groupedByDate[dateKey]) {
                groupedByDate[dateKey] = [];
            }
            groupedByDate[dateKey].push(d);
        });

        return { deliveries, groupedByDate };
    }, [removals]);

    const handleDownloadPdf = (dateKey: string, removalsForDate: Removal[]) => {
        const reportId = `delivery-report-${dateKey}`;
        const reportElement = document.createElement('div');
        reportElement.id = reportId;
        reportElement.style.position = 'absolute';
        reportElement.style.left = '-9999px';
        reportElement.style.width = '800px';
        reportElement.style.padding = '20px';
        reportElement.style.fontFamily = 'Arial, sans-serif';
        reportElement.style.color = '#000';
        reportElement.style.backgroundColor = '#fff';

        const formattedDate = format(new Date(dateKey + 'T00:00:00'), "dd/MM/yyyy", { locale: ptBR });

        let tableRows = '';
        removalsForDate.forEach(removal => {
            const address = removal.deliveryAddress || removal.removalAddress;
            const fullAddress = `${address.street}, ${address.number} - ${address.neighborhood}, ${address.city} - ${address.state}, CEP: ${address.cep}`;
            tableRows += `
                <tr style="border-bottom: 1px solid #ccc;">
                    <td style="padding: 8px; border: 1px solid #ddd;">${removal.pet.name}</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${removal.tutor.name}</td>
                    <td style="padding: 8px; border: 1px solid #ddd; font-family: monospace;">${removal.code}</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${fullAddress}</td>
                </tr>
            `;
        });

        reportElement.innerHTML = `
            <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="font-size: 24px; font-weight: bold;">Pet Anjinho - Relação de Entrega</h1>
                <p style="font-size: 18px;">Data: ${formattedDate}</p>
            </div>
            <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                <thead style="background-color: #f2f2f2;">
                    <tr>
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Pet</th>
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Tutor</th>
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Código</th>
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Endereço</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>
        `;

        document.body.appendChild(reportElement);

        html2canvas(reportElement, { scale: 2, useCORS: true }).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const canvasWidth = canvas.width;
            const canvasHeight = canvas.height;
            const ratio = canvasWidth / canvasHeight;
            const imgWidth = pdfWidth - 20;
            const imgHeight = imgWidth / ratio;
            
            pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
            pdf.save(`relatorio_entregas_${formattedDate.replace(/\//g, '-')}.pdf`);

            document.body.removeChild(reportElement);
        }).catch(err => {
            console.error("Erro ao gerar PDF:", err);
            alert("Ocorreu um erro ao gerar o PDF. Por favor, tente novamente.");
            document.body.removeChild(reportElement);
        });
    };

    const { deliveries, groupedByDate } = scheduledDeliveries;

    if (deliveries.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500">
                <Truck size={48} className="mx-auto text-gray-300 mb-4" />
                <p>Nenhuma entrega agendada encontrada.</p>
            </div>
        );
    }

    return (
        <>
            <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data da Entrega</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome do Pet</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome do Tutor</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Endereço da Entrega</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {deliveries.map((removal) => {
                                const dateKey = removal.scheduledDeliveryDate!;
                                const isFirstOfGroup = groupedByDate[dateKey]?.[0]?.code === removal.code;
                                const groupSize = groupedByDate[dateKey]?.length || 1;
                                const address = removal.deliveryAddress || removal.removalAddress;

                                return (
                                    <tr key={removal.code} className="hover:bg-gray-50">
                                        {isFirstOfGroup && (
                                            <td rowSpan={groupSize} className="px-4 py-4 align-top border-r">
                                                <div className="flex flex-col items-center justify-center h-full gap-3">
                                                    <span className="font-semibold text-gray-800 whitespace-nowrap">
                                                        {format(new Date(dateKey + 'T00:00:00'), "dd/MM/yyyy", { locale: ptBR })}
                                                    </span>
                                                    <button
                                                        onClick={() => handleDownloadPdf(dateKey, groupedByDate[dateKey])}
                                                        className="flex items-center gap-2 text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded-md hover:bg-blue-200 font-semibold"
                                                    >
                                                        <Download size={14} />
                                                        Baixar Relatório
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{removal.pet.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{removal.tutor.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{removal.code}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{`${address.street}, ${address.number} - ${address.neighborhood}, ${address.city} - ${address.state}, CEP: ${address.cep}`}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <div className="flex items-center justify-center gap-3">
                                                <button
                                                    onClick={() => setConfirmingDelivery(removal)}
                                                    className="text-green-500 hover:text-green-700 p-2 rounded-full hover:bg-green-100"
                                                    title="Marcar como entregue"
                                                >
                                                    <CheckCircle size={16} />
                                                </button>
                                                <button
                                                    onClick={() => onCancelDelivery(removal.code)}
                                                    className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-100"
                                                    title="Cancelar agendamento"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
            <ConfirmDeliveryModal
                isOpen={!!confirmingDelivery}
                onClose={() => setConfirmingDelivery(null)}
                onConfirm={(deliveryPerson) => {
                    if (confirmingDelivery) {
                        onMarkAsDelivered(confirmingDelivery.code, deliveryPerson);
                    }
                }}
                removal={confirmingDelivery}
            />
        </>
    );
};

export default ScheduledDeliveryList;
