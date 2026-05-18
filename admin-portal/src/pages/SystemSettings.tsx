import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Plus, RefreshCw, Save, Settings, Trash2, X } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

type OptionType = 'class' | 'section';

interface SystemOption {
  id: string;
  option_type: OptionType;
  value: string;
  sort_order: number;
  is_active: boolean;
}

interface OptionGroupProps {
  title: string;
  description: string;
  optionType: OptionType;
  options: SystemOption[];
  newValue: string;
  onNewValueChange: (value: string) => void;
  onCreate: (optionType: OptionType) => void;
  onUpdate: (option: SystemOption, data: Partial<SystemOption>) => void;
  onDelete: (option: SystemOption) => void;
  isSaving: boolean;
}

function OptionGroup({
  title,
  description,
  optionType,
  options,
  newValue,
  onNewValueChange,
  onCreate,
  onUpdate,
  onDelete,
  isSaving,
}: OptionGroupProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editOrder, setEditOrder] = useState('');

  const startEditing = (option: SystemOption) => {
    setEditingId(option.id);
    setEditValue(option.value);
    setEditOrder(String(option.sort_order));
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditValue('');
    setEditOrder('');
  };

  const saveEditing = (option: SystemOption) => {
    const parsedOrder = Number(editOrder);
    if (!editValue.trim()) {
      toast.error('Option name is required');
      return;
    }
    if (!Number.isInteger(parsedOrder) || parsedOrder < 0) {
      toast.error('Sort order must be a whole number');
      return;
    }

    onUpdate(option, {
      value: editValue.trim(),
      sort_order: parsedOrder,
    });
    cancelEditing();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          </div>
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {options.filter((option) => option.is_active).length} active
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            value={newValue}
            onChange={(event) => onNewValueChange(event.target.value)}
            placeholder={`Add ${optionType}`}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                onCreate(optionType);
              }
            }}
          />
          <Button
            onClick={() => onCreate(optionType)}
            disabled={isSaving || !newValue.trim()}
            className="sm:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px]">
            <thead>
              <tr className="border-b text-left text-sm text-muted-foreground">
                <th className="py-2 pr-3 font-medium">Name</th>
                <th className="py-2 px-3 font-medium w-28">Order</th>
                <th className="py-2 px-3 font-medium w-24">Active</th>
                <th className="py-2 pl-3 font-medium text-right w-36">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {options.map((option) => {
                const isEditing = editingId === option.id;

                return (
                  <tr key={option.id}>
                    <td className="py-3 pr-3">
                      {isEditing ? (
                        <Input
                          value={editValue}
                          onChange={(event) => setEditValue(event.target.value)}
                          autoFocus
                        />
                      ) : (
                        <span className={option.is_active ? 'font-medium' : 'text-muted-foreground line-through'}>
                          {option.value}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      {isEditing ? (
                        <Input
                          type="number"
                          min={0}
                          value={editOrder}
                          onChange={(event) => setEditOrder(event.target.value)}
                        />
                      ) : (
                        <span className="text-sm">{option.sort_order}</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <Checkbox
                        checked={option.is_active}
                        disabled={isSaving}
                        onCheckedChange={(checked) => {
                          onUpdate(option, { is_active: Boolean(checked) });
                        }}
                        aria-label={`Toggle ${option.value}`}
                      />
                    </td>
                    <td className="py-3 pl-3">
                      <div className="flex justify-end gap-2">
                        {isEditing ? (
                          <>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => saveEditing(option)}
                              disabled={isSaving}
                              title="Save option"
                            >
                              <Save className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={cancelEditing}
                              disabled={isSaving}
                              title="Cancel editing"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => startEditing(option)}
                              disabled={isSaving}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => onDelete(option)}
                              disabled={isSaving}
                              className="text-red-600 hover:text-red-700"
                              title="Delete option"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {options.length === 0 && (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No {optionType} options configured yet.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function SystemSettings() {
  const [classes, setClasses] = useState<SystemOption[]>([]);
  const [sections, setSections] = useState<SystemOption[]>([]);
  const [newClass, setNewClass] = useState('');
  const [newSection, setNewSection] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchOptions = async (showToast = false) => {
    setIsLoading(true);
    try {
      const response = await api.getSystemOptions();
      setClasses(response.data?.classes || []);
      setSections(response.data?.sections || []);
      if (showToast) {
        toast.success('System options refreshed');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to load system options');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOptions();
  }, []);

  const createOption = async (optionType: OptionType) => {
    const value = optionType === 'class' ? newClass.trim() : newSection.trim();
    if (!value) {
      toast.error('Option name is required');
      return;
    }

    setIsSaving(true);
    try {
      await api.createSystemOption(optionType, value);
      if (optionType === 'class') {
        setNewClass('');
      } else {
        setNewSection('');
      }
      await fetchOptions();
      toast.success(`${optionType === 'class' ? 'Class' : 'Section'} added`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to add option');
    } finally {
      setIsSaving(false);
    }
  };

  const updateOption = async (option: SystemOption, data: Partial<SystemOption>) => {
    setIsSaving(true);
    try {
      await api.updateSystemOption(option.id, {
        value: data.value,
        sort_order: data.sort_order,
        is_active: data.is_active,
      });
      await fetchOptions();
      toast.success('Option updated');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update option');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteOption = async (option: SystemOption) => {
    if (!confirm(`Delete "${option.value}"? Existing students keep their saved value, but it will no longer appear in new forms.`)) {
      return;
    }

    setIsSaving(true);
    try {
      await api.deleteSystemOption(option.id);
      await fetchOptions();
      toast.success('Option deleted');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete option');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 border-b sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                <Settings className="w-6 h-6" />
                System Settings
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Manage the class and section choices shown in school portal forms.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchOptions(true)}
              disabled={isSaving}
              className="min-h-[44px]"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <OptionGroup
          title="Classes"
          description="These values appear in add student, edit student, and student filters."
          optionType="class"
          options={classes}
          newValue={newClass}
          onNewValueChange={setNewClass}
          onCreate={createOption}
          onUpdate={updateOption}
          onDelete={deleteOption}
          isSaving={isSaving}
        />

        <OptionGroup
          title="Sections"
          description="These values appear wherever a school selects or filters a student section."
          optionType="section"
          options={sections}
          newValue={newSection}
          onNewValueChange={setNewSection}
          onCreate={createOption}
          onUpdate={updateOption}
          onDelete={deleteOption}
          isSaving={isSaving}
        />
      </div>
    </div>
  );
}
