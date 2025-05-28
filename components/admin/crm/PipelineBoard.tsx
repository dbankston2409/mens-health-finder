import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { CrmContact, CrmPipeline, DEFAULT_PIPELINE_STAGES } from '../../../utils/crm/crmContactModel';
import { TierBadge } from '../../TierBadge';

interface PipelineBoardProps {
  contacts: CrmContact[];
  pipeline: CrmPipeline;
  onContactStageChange: (contactId: string, newStage: string) => void;
  onContactClick: (contact: CrmContact) => void;
}

interface ContactCard {
  contact: CrmContact;
  onClick: () => void;
}

const ContactCard: React.FC<ContactCard> = ({ contact, onClick }) => {
  const formatCurrency = (amount?: number) => {
    if (!amount) return '';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getDaysAgo = (date?: any) => {
    if (!date) return '';
    const now = new Date();
    const pastDate = date.toDate ? date.toDate() : new Date(date);
    const diffTime = Math.abs(now.getTime() - pastDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays}d ago`;
  };

  return (
    <div
      onClick={onClick}
      className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-900 truncate">
            {contact.firstName} {contact.lastName}
          </h4>
          <p className="text-xs text-gray-500 truncate">
            {contact.company || contact.email}
          </p>
        </div>
        <TierBadge score={contact.leadScore} size="xs" />
      </div>
      
      {contact.estimatedValue && (
        <div className="text-sm font-medium text-green-600 mb-2">
          {formatCurrency(contact.estimatedValue)}
        </div>
      )}
      
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span className={`inline-flex items-center px-2 py-1 rounded-full ${
          contact.priority === 'urgent' ? 'bg-red-100 text-red-700' :
          contact.priority === 'high' ? 'bg-orange-100 text-orange-700' :
          contact.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
          'bg-gray-100 text-gray-700'
        }`}>
          {contact.priority}
        </span>
        
        {contact.lastContactDate && (
          <span>{getDaysAgo(contact.lastContactDate)}</span>
        )}
      </div>
      
      {contact.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {contact.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100 text-blue-700"
            >
              {tag}
            </span>
          ))}
          {contact.tags.length > 2 && (
            <span className="text-xs text-gray-500">+{contact.tags.length - 2}</span>
          )}
        </div>
      )}
    </div>
  );
};

export const PipelineBoard: React.FC<PipelineBoardProps> = ({
  contacts,
  pipeline,
  onContactStageChange,
  onContactClick
}) => {
  const [stages] = useState(pipeline.stages.length > 0 ? pipeline.stages : DEFAULT_PIPELINE_STAGES);
  const [contactsByStage, setContactsByStage] = useState<Record<string, CrmContact[]>>({});

  useEffect(() => {
    // Group contacts by pipeline stage
    const grouped = contacts.reduce((acc, contact) => {
      const stage = contact.pipelineStage || 'new';
      if (!acc[stage]) {
        acc[stage] = [];
      }
      acc[stage].push(contact);
      return acc;
    }, {} as Record<string, CrmContact[]>);

    setContactsByStage(grouped);
  }, [contacts]);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    
    if (source.droppableId === destination.droppableId) return;

    // Find the contact being moved
    const contact = contacts.find(c => c.id === draggableId);
    if (!contact) return;

    // Update the contact's stage
    onContactStageChange(contact.id, destination.droppableId);
  };

  const getStageMetrics = (stageId: string) => {
    const stageContacts = contactsByStage[stageId] || [];
    const totalValue = stageContacts.reduce((sum, contact) => sum + (contact.estimatedValue || 0), 0);
    const avgScore = stageContacts.length > 0 
      ? stageContacts.reduce((sum, contact) => sum + contact.leadScore, 0) / stageContacts.length 
      : 0;
    
    return {
      count: stageContacts.length,
      totalValue,
      avgScore: Math.round(avgScore)
    };
  };

  return (
    <div className="h-full overflow-x-auto">
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex space-x-4 min-w-max p-4">
          {stages.map((stage) => {
            const metrics = getStageMetrics(stage.id);
            
            return (
              <div key={stage.id} className="w-80 flex-shrink-0">
                {/* Stage Header */}
                <div className="bg-gray-50 p-4 rounded-t-lg border-b">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-900">{stage.name}</h3>
                    <span 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: stage.color }}
                    />
                  </div>
                  
                  <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-gray-600">
                    <div>
                      <div className="font-medium">{metrics.count}</div>
                      <div>Contacts</div>
                    </div>
                    <div>
                      <div className="font-medium">
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'USD',
                          notation: 'compact',
                          maximumFractionDigits: 0
                        }).format(metrics.totalValue)}
                      </div>
                      <div>Total Value</div>
                    </div>
                    <div>
                      <div className="font-medium">{metrics.avgScore}</div>
                      <div>Avg Score</div>
                    </div>
                  </div>
                  
                  <div className="mt-2 text-xs text-gray-500">
                    {stage.winProbability}% win probability
                  </div>
                </div>

                {/* Droppable Area */}
                <Droppable droppableId={stage.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`min-h-[500px] p-3 bg-gray-50 rounded-b-lg space-y-3 ${
                        snapshot.isDraggingOver ? 'bg-blue-50 border-2 border-blue-200 border-dashed' : ''
                      }`}
                    >
                      {(contactsByStage[stage.id] || []).map((contact, index) => (
                        <Draggable key={contact.id} draggableId={contact.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`${
                                snapshot.isDragging ? 'rotate-3 shadow-lg' : ''
                              }`}
                            >
                              <ContactCard
                                contact={contact}
                                onClick={() => onContactClick(contact)}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      
                      {(contactsByStage[stage.id] || []).length === 0 && (
                        <div className="text-center py-8 text-gray-400 text-sm">
                          No contacts in this stage
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
};