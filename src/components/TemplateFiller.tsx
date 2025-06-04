
import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, FileText, Calendar, User, MapPin, DollarSign, Hash, Download } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

import {
  Document,
  Page,
  Text,
  StyleSheet,
  Font,
  pdf,
} from '@react-pdf/renderer';

Font.register({
  family: 'TimesNewRoman',
  src: '/fonts/timesnewromanpsmt.ttf',
});

const styles = StyleSheet.create({
  page: {
    fontFamily: 'TimesNewRoman',
    fontSize: 13,
    padding: 40,
    lineHeight: 1.5,
    width: 595,
    height: 842,
  },
});


const htmlToPlainText = (html) => {
  if (!html) return '';
  let text = html.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<\/p>/gi, '\n');
  text = text.replace(/<[^>]+>/g, '');
  return text;
};

const extractPlaceholders = (content) => {
  const placeholderRegex = /\{\{([^}]+)\}\}/g;
  const matches = [];
  let match;
  while ((match = placeholderRegex.exec(content)) !== null) {
    const placeholder = match[1].trim();
    if (!matches.find(m => m.key === placeholder)) {
      matches.push({
        key: placeholder,
        label: placeholder.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      });
    }
  }
  return matches;
};

const MyDocument = ({ content }) => {
  const plainText = htmlToPlainText(content);
  return (
    <Document>
      <Page style={styles.page}>
        <Text>{plainText}</Text>
      </Page>
    </Document>
  );
};

const TemplateFiller = ({ template, onBack }) => {
  const placeholders = useMemo(() => extractPlaceholders(template?.content || ''), [template]);

  const [formData, setFormData] = useState(() => {
    const initialData = {};
    placeholders.forEach(p => {
      initialData[p.key] = '';
    });
    return initialData;
  });

  const [generatedContent, setGeneratedContent] = useState('');

  const handleInputChange = (key, value) => {
    setFormData(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const generateDocument = () => {
    let content = template?.content || '';
    Object.entries(formData).forEach(([key, value]) => {
      const placeholder = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
      content = content.replace(placeholder, value || `[${key}]`);
    });
    setGeneratedContent(content);
    toast({
      title: "Документ сгенерирован",
      description: "Ваш документ успешно сгенерирован с заполненными данными.",
    });
  };

  const handleDownload = async () => {
    if (!generatedContent) {
      generateDocument();
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    const doc = <MyDocument content={generatedContent} />;
    const asPdf = pdf();
    asPdf.updateContainer(doc);
    const blob = await asPdf.toBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${template?.title || 'document'}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Документ сохранён",
      description: "PDF файл успешно сохранён.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <header className="bg-white/80 backdrop-blur-md border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={onBack}
                className="hover:bg-white/60"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Назад к панели
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Заполнить шаблон</h1>
                <p className="text-sm text-gray-600">{template?.title}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <Card className="bg-white/60 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Заполните поля шаблона
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Заполните поля ниже для настройки документа
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {placeholders.map((placeholder) => {
                  const Icon = (() => {
                    const key = placeholder.key.toLowerCase();
                    if (key.includes('date')) return Calendar;
                    if (key.includes('address') || key.includes('location')) return MapPin;
                    if (key.includes('amount') || key.includes('price') || key.includes('cost')) return DollarSign;
                    if (key.includes('number') || key.includes('quantity')) return Hash;
                    return User;
                  })();

                  return (
                    <div key={placeholder.key}>
                      <Label htmlFor={placeholder.key} className="flex items-center mb-2">
                        <Icon className="h-4 w-4 mr-2 text-gray-500" />
                        {placeholder.label}
                      </Label>
                      {(placeholder.key.toLowerCase().includes('address') || placeholder.key.toLowerCase().includes('location')) ? (
                        <Textarea
                          id={placeholder.key}
                          value={formData[placeholder.key]}
                          onChange={(e) => handleInputChange(placeholder.key, e.target.value)}
                          placeholder={`Введите ${placeholder.label.toLowerCase()}`}
                          className="bg-white/60 border-white/20 focus:bg-white/80"
                          rows={3}
                        />
                      ) : (
                        <Input
                          id={placeholder.key}
                          type={placeholder.key.toLowerCase().includes('date') ? 'date' : 'text'}
                          value={formData[placeholder.key]}
                          onChange={(e) => handleInputChange(placeholder.key, e.target.value)}
                          placeholder={`Введите ${placeholder.label.toLowerCase()}`}
                          className="bg-white/60 border-white/20 focus:bg-white/80"
                        />
                      )}
                    </div>
                  );
                })}

                <Button
                  onClick={generateDocument}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 mt-6"
                >
                  Сгенерировать документ
                </Button>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="bg-white/60 backdrop-blur-sm border-white/20 h-[calc(100vh-200px)] flex flex-col">
              <CardHeader>
                <CardTitle>Предпросмотр и скачивание</CardTitle>
                <p className="text-sm text-gray-600">
                  {generatedContent ? 'Ваш сгенерированный документ' : 'Заполните поля и сгенерируйте документ'}
                </p>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto bg-white p-6 rounded-lg border border-gray-200 shadow-inner whitespace-pre-wrap font-serif text-gray-800 leading-relaxed">
                {generatedContent ? htmlToPlainText(generatedContent) : 'Предпросмотр документа появится здесь после генерации.'}
              </CardContent>
              <div className="p-4">
                {generatedContent && (
                  <Button
                    onClick={handleDownload}
                    className="w-full inline-flex justify-center items-center bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded cursor-pointer"
                  >
                    <Download className="inline-block mr-2" />
                    Скачать PDF
                  </Button>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateFiller;
