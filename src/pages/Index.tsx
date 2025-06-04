import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Plus, Edit, Search, Filter, Clock, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import TemplateCreator from '@/components/TemplateCreator';
import TemplateFiller from '@/components/TemplateFiller';

import { collection, getDocs } from "firebase/firestore";
import { db } from '@/firebase';

const Index = () => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'create' | 'edit' | 'fill'>('dashboard');
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTemplates = async () => {
      setLoading(true);
      try {
        const templatesRef = collection(db, "templates");
        const snapshot = await getDocs(templatesRef);
        const allTemplates = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTemplates(allTemplates);
      } catch (error) {
        console.error("Error fetching templates:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  const filteredTemplates = templates.filter(template =>
    template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUseTemplate = (template: any) => {
    setSelectedTemplate(template);
    setCurrentView('fill');
  };

  const handleEditTemplate = (template: any) => {
    setSelectedTemplate(template);
    setCurrentView('edit');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500 text-lg">
        Загрузка шаблонов...
      </div>
    );
  }

  if (currentView === 'create') {
    return <TemplateCreator onBack={() => setCurrentView('dashboard')} template={undefined} />;
  }

  if (currentView === 'edit') {
    return <TemplateCreator template={selectedTemplate} onBack={() => setCurrentView('dashboard')} />;
  }

  if (currentView === 'fill') {
    return <TemplateFiller template={selectedTemplate} onBack={() => setCurrentView('dashboard')} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <header className="bg-white/80 backdrop-blur-md border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-lg">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                BTGP
              </h1>
            </div>
            <Button
              onClick={() => setCurrentView('create')}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Plus className="h-4 w-4 mr-2" />
              Создать шаблон
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Добро пожаловать!</h2>
          <p className="text-gray-600">Управляйте шаблонами документов и создавайте профессиональные документы за минуты.</p>
        </div>

        <div className="mb-8 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Поиск шаблонов..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/60 backdrop-blur-sm border-white/20 focus:bg-white/80"
            />
          </div>
          <Button variant="outline" className="bg-white/60 backdrop-blur-sm border-white/20 hover:bg-white/80">
            <Filter className="h-4 w-4 mr-2" />
            Фильтр
          </Button>
        </div>

        <section>
          <div className="flex items-center mb-6">
            <h3 className="text-2xl font-bold text-gray-900">Все шаблоны</h3>
            <Badge variant="secondary" className="ml-3 bg-blue-100 text-blue-700">
              {filteredTemplates.length} шаблонов
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredTemplates.map((template) => (
              <Card
                key={template.id}
                className="group hover:shadow-xl transition-all duration-300 bg-white/60 backdrop-blur-sm border-white/20 hover:bg-white/80 hover:scale-105"
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                      {template.category}
                    </Badge>
                    <div className="flex items-center text-xs text-gray-500">
                      {template.isPublic ? <Users className="h-3 w-3 mr-1" /> : <FileText className="h-3 w-3 mr-1" />}
                      {template.isPublic ? 'Публичный' : 'Приватный'}
                    </div>
                  </div>
                  <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
                    {template.title}
                  </CardTitle>
                  <CardDescription className="text-sm">
                    {template.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4 text-sm text-gray-500">
                    <span>
                      {Array.isArray(template.placeholders)
                        ? template.placeholders.length
                        : template.placeholders}{' '}
                      полей
                    </span>
                    <div className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {template.lastUsed || 'N/A'}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleUseTemplate(template)}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                    >
                      Использовать
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditTemplate(template)}
                      className="bg-white/60 border-white/20 hover:bg-white/80"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Index;
