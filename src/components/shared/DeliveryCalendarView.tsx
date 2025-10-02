import React, { useState, useMemo } from 'react';
import { Removal } from '../../types';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Package } from 'lucide-react';
import DayDetailsModal from '../modals/DayDetailsModal';

interface DeliveryCalendarViewProps {
    removals: Removal[];
    onCancelDelivery: (removalCode: string) => void;
}

const DeliveryCalendarView: React.FC<DeliveryCalendarViewProps> = ({ removals, onCancelDelivery }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDay, setSelectedDay] = useState<Date | null>(null);

    const firstDayOfMonth = startOfMonth(currentDate);
    const lastDayOfMonth = endOfMonth(currentDate);
    const firstDayOfGrid = startOfWeek(firstDayOfMonth, { weekStartsOn: 0 }); // Sunday
    const lastDayOfGrid = endOfWeek(lastDayOfMonth, { weekStartsOn: 0 });
    const daysInGrid = eachDayOfInterval({ start: firstDayOfGrid, end: lastDayOfGrid });

    const deliveriesByDay = useMemo(() => {
        const map = new Map<string, Removal[]>();
        removals.forEach(removal => {
            if (removal.scheduledDeliveryDate) {
                // FIX: Parse date string as local time to avoid timezone shift
                const localDate = new Date(removal.scheduledDeliveryDate + 'T00:00:00');
                const dateKey = format(localDate, 'yyyy-MM-dd');
                if (!map.has(dateKey)) {
                    map.set(dateKey, []);
                }
                map.get(dateKey)!.push(removal);
            }
        });
        return map;
    }, [removals]);

    const handleDayClick = (day: Date) => {
        const dateKey = format(day, 'yyyy-MM-dd');
        if (deliveriesByDay.has(dateKey)) {
            setSelectedDay(day);
        }
    };

    const selectedDayRemovals = useMemo(() => {
        if (!selectedDay) return [];
        const dateKey = format(selectedDay, 'yyyy-MM-dd');
        return deliveriesByDay.get(dateKey) || [];
    }, [selectedDay, deliveriesByDay]);

    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    return (
        <div className="bg-white p-4 rounded-lg shadow-lg border">
            <div className="flex justify-between items-center mb-4 px-2">
                <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-2 rounded-full hover:bg-gray-100">
                    <ChevronLeft />
                </button>
                <h2 className="text-xl font-bold text-gray-800">
                    {format(currentDate, 'MMMM yyyy', { locale: ptBR }).replace(/^\w/, c => c.toUpperCase())}
                </h2>
                <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-2 rounded-full hover:bg-gray-100">
                    <ChevronRight />
                </button>
            </div>
            <div className="grid grid-cols-7 gap-px bg-gray-200 border-t border-l border-gray-200">
                {weekDays.map(day => (
                    <div key={day} className="text-center py-2 text-xs font-semibold text-gray-600 bg-gray-50">
                        {day}
                    </div>
                ))}
                {daysInGrid.map(day => {
                    const dateKey = format(day, 'yyyy-MM-dd');
                    const deliveries = deliveriesByDay.get(dateKey);
                    const isCurrentMonth = isSameMonth(day, currentDate);
                    const isToday = isSameDay(day, new Date());
                    const hasDeliveries = deliveries && deliveries.length > 0;

                    return (
                        <div
                            key={day.toString()}
                            onClick={() => handleDayClick(day)}
                            className={`relative p-2 h-28 bg-white ${isCurrentMonth ? '' : 'bg-gray-50 text-gray-400'} ${hasDeliveries ? 'cursor-pointer hover:bg-blue-50' : ''}`}
                        >
                            <span className={`absolute top-2 right-2 text-sm ${isToday ? 'bg-blue-600 text-white rounded-full h-6 w-6 flex items-center justify-center' : ''}`}>
                                {format(day, 'd')}
                            </span>
                            {hasDeliveries && (
                                <div className="absolute bottom-2 left-2 flex items-center gap-1 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                    <Package size={12} />
                                    <span>{deliveries.length}</span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            {selectedDay && (
                <DayDetailsModal
                    isOpen={!!selectedDay}
                    onClose={() => setSelectedDay(null)}
                    day={selectedDay}
                    removals={selectedDayRemovals}
                    onCancelDelivery={onCancelDelivery}
                />
            )}
        </div>
    );
};

export default DeliveryCalendarView;
