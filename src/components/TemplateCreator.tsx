
import React, { useState } from 'react';
import {
  EditorState,
  ContentState,
  AtomicBlockUtils,
  Modifier,
  convertToRaw,
} from 'draft-js';
import { Editor } from 'react-draft-wysiwyg';
import draftToHtml from 'draftjs-to-html';
import htmlToDraft from 'html-to-draftjs';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';
import './templateCreator.css';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, Eye, Type, Hash, Calendar, User, MapPin, DollarSign, Image as ImageIcon } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

import { collection, doc, setDoc, addDoc } from "firebase/firestore";
import { db } from '@/firebase';

const MediaComponent = (props) => {
  const entity = props.contentState.getEntity(props.block.getEntityAt(0));
  const { src, type, placeholder } = entity.getData();

  if (type === 'IMAGE') {
    return <img src={src} alt="штамп" style={{ maxWidth: 150, cursor: 'pointer' }} onClick={props.onRemove} />;
  }

  if (type === 'PLACEHOLDER') {
    return (
      <span
        style={{
          backgroundColor: '#eee',
          padding: '2px 4px',
          borderRadius: 3,
          cursor: 'pointer',
          userSelect: 'none',
        }}
        onClick={props.onRemove}
      >
        {placeholder}
      </span>
    );
  }

  return null;
};


const mediaBlockRenderer = (block, { onRemoveEntity }) => {
  if (block.getType() === 'atomic') {
    return {
      component: (props) => <MediaComponent {...props} onRemove={() => onRemoveEntity(block.getKey())} />,
      editable: false,
    };
  }
  return null;
};


const TemplateCreator = ({ template, onBack }) => {
  const html = template?.content || 'Начните вводить содержимое документа здесь...\n\nЧтобы добавить поле-заполнитель, используйте кнопки ниже для вставки меток, например {{company_name}} или {{date}}.';
  const blocksFromHtml = htmlToDraft(html);
  const contentState = ContentState.createFromBlockArray(blocksFromHtml.contentBlocks, blocksFromHtml.entityMap);
  const [editorState, setEditorState] = useState(() => EditorState.createWithContent(contentState));

  const [templateData, setTemplateData] = useState({
    title: template?.title || '',
    description: template?.description || '',
    category: template?.category || '',
    stampUrl: template?.stampUrl || null,
  });

  const [placeholders, setPlaceholders] = useState(template?.placeholders || []);

  const placeholderTypes = [
    { type: 'text', label: 'Текстовое поле', icon: Type, placeholder: '{{Текст}}' },
    { type: 'number', label: 'Число', icon: Hash, placeholder: '{{Номер}}' },
    { type: 'date', label: 'Дата', icon: Calendar, placeholder: '{{Дата}}' },
    { type: 'person', label: 'Имя человека', icon: User, placeholder: '{{Имя}}' },
    { type: 'address', label: 'Адрес', icon: MapPin, placeholder: '{{Адрес}}' },
    { type: 'currency', label: 'Валюта', icon: DollarSign, placeholder: '{{Деньги}}' },
  ];

  const categories = ['Юридический', 'Финансы', 'Кадры', 'Бизнес', 'Внутренний', 'Маркетинг'];

  const stampUrlFromServer = '!!!'; 
  // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

  const insertImage = (editorState, src) => {
    const contentState = editorState.getCurrentContent();
    const contentStateWithEntity = contentState.createEntity('IMAGE', 'IMMUTABLE', { src, type: 'IMAGE' });
    const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
    return AtomicBlockUtils.insertAtomicBlock(editorState, entityKey, ' ');
  };

  const insertPlaceholder = (editorState, placeholderText, placeholderType, label) => {
    const contentState = editorState.getCurrentContent();
    const contentStateWithEntity = contentState.createEntity('PLACEHOLDER', 'IMMUTABLE', {
      placeholder: placeholderText,
      type: 'PLACEHOLDER',
      label,
    });
    const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
    const newContentState = Modifier.insertText(
      contentState,
      editorState.getSelection(),
      placeholderText,
      null,
      entityKey
    );
    return EditorState.push(editorState, newContentState, 'insert-characters');
  };

  const handleInsertPlaceholder = (placeholderType) => {
    const base = placeholderType.placeholder.replace(/[{}]/g, '').trim(); // например "date_field"
    const uniqueKey = generateUniquePlaceholder(base);
    const uniquePlaceholder = `{{${uniqueKey}}}`;

    const newEditorState = insertPlaceholder(editorState, uniquePlaceholder, placeholderType.type, placeholderType.label);
    setEditorState(newEditorState);

    setPlaceholders(prev => [...prev, {
      id: Date.now(),
      type: placeholderType.type,
      label: placeholderType.label,
      placeholder: uniquePlaceholder,
      required: true,
    }]);
  };



  const handleAddStamp = () => {
    const newEditorState = insertImage(editorState, stampUrlFromServer);
    setEditorState(newEditorState);
    setTemplateData((prev) => ({
      ...prev,
      stampUrl: stampUrlFromServer,
    }));
    toast({
      title: 'Штамп добавлен',
      description: 'Изображение штампа организации добавлено в шаблон.',
    });
  };
  const generateUniquePlaceholder = (base) => {
    let counter = 1;
    let uniqueKey = `${base}_${counter}`;
    while (placeholders.find(p => p.placeholder === `{{${uniqueKey}}}`)) {
      counter++;
      uniqueKey = `${base}_${counter}`;
    }
    return uniqueKey;
  };

  const removeEntity = (blockKey) => {
    const contentState = editorState.getCurrentContent();
    const block = contentState.getBlockForKey(blockKey);
    const blockText = block.getText();
    const blockSelection = editorState.getSelection().merge({
      anchorKey: blockKey,
      anchorOffset: 0,
      focusKey: blockKey,
      focusOffset: blockText.length,
    });

    const newContentState = Modifier.removeRange(contentState, blockSelection, 'backward');
    const newEditorState = EditorState.push(editorState, newContentState, 'remove-range');
    setEditorState(EditorState.forceSelection(newEditorState, newContentState.getSelectionAfter()));
  };

  const blockRendererFn = (block) => mediaBlockRenderer(block, { onRemoveEntity: removeEntity });

  const handleSave = async () => {
    const contentHtml = draftToHtml(convertToRaw(editorState.getCurrentContent()));

    if (!templateData.title.trim()) {
      toast({
        title: "Отсутствует название",
        description: "Пожалуйста, введите название шаблона.",
        variant: "destructive",
      });
      return;
    }

    if (!templateData.category) {
      toast({
        title: "Отсутствует категория",
        description: "Пожалуйста, выберите категорию для шаблона.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (template?.id) {
        const templateRef = doc(db, "templates", template.id);
        await setDoc(templateRef, {
          ...templateData,
          content: contentHtml,
          placeholders,
        }, { merge: true });
      } else {
        const templatesRef = collection(db, "templates");
        await addDoc(templatesRef, {
          ...templateData,
          content: contentHtml,
          placeholders,
          isPublic: false,
          lastUsed: null,
        });
      }

      toast({
        title: "Шаблон сохранён",
        description: `Ваш шаблон «${templateData.title}» успешно сохранён.`,
      });

      onBack();
    } catch (error) {
      console.error("Ошибка при сохранении шаблона:", error);
      toast({
        title: "Ошибка сохранения",
        description: "Произошла ошибка при сохранении шаблона.",
        variant: "destructive",
      });
    }
  };

  const handlePreview = () => {
    toast({
      title: "Режим предпросмотра",
      description: "Здесь будет отображён предварительный просмотр шаблона с примерными данными.",
    });
  };

  return (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
    <header className="bg-white/80 backdrop-blur-md border-b border-white/20 sticky top-0 z-50">
      <div className="max-w-7xl container px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={onBack} className="hover:bg-white/60">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад в панель
            </Button>
            <h1 className="text-xl font-semibold text-gray-900">
              {template ? 'Редактировать шаблон' : 'Создать новый шаблон'}
            </h1>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline" onClick={handlePreview} className="bg-white/60 backdrop-blur-sm border-white/20 hover:bg-white/80">
              <Eye className="h-4 w-4 mr-2" />
              Предпросмотр
            </Button>
            <Button onClick={handleSave} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200">
              <Save className="h-4 w-4 mr-2" />
              Сохранить шаблон
            </Button>
          </div>
        </div>
      </div>
    </header>
    <div className="max-w-7xl container px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Настройки шаблона */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-white/60 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle>Настройки шаблона</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Название шаблона</Label>
                <Input
                  id="title"
                  value={templateData.title}
                  onChange={(e) => setTemplateData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Введите название шаблона..."
                  className="mt-1 bg-white/60 border-white/20 focus:bg-white/80"
                />
              </div>

              <div>
                <Label htmlFor="description">Описание</Label>
                <textarea
                  id="description"
                  value={templateData.description}
                  onChange={(e) => setTemplateData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Опишите назначение шаблона..."
                  className="mt-1 bg-white/60 border-white/20 focus:bg-white/80 w-full rounded p-2 resize-none"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="category">Категория</Label>
                <Select value={templateData.category} onValueChange={(value) => setTemplateData(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger className="mt-1 bg-white/60 border-white/20 focus:bg-white/80">
                    <SelectValue placeholder="Выберите категорию" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/60 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle>Вставить плейсхолдеры и штамп</CardTitle>
              <p className="text-sm text-gray-600">Нажмите, чтобы вставить поля-заполнители или добавить штамп в шаблон</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2">
                {placeholderTypes.map((type) => (
                  <Button
                    key={type.type}
                    variant="outline"
                    size="sm"
                    onClick={() => handleInsertPlaceholder(type)}
                    className="justify-start bg-white/60 border-white/20 hover:bg-white/80 text-left"
                  >
                    <type.icon className="h-3 w-3 mr-2" />
                    <span className="text-xs">{type.label}</span>
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddStamp}
                  className="justify-start bg-white/60 border-white/20 hover:bg-white/80 text-left"
                >
                  <ImageIcon className="h-3 w-3 mr-2" />
                  <span className="text-xs">Добавить штамп</span>
                </Button>
              </div>
              {templateData.stampUrl && (
                <div className="mt-4 flex flex-col items-center">
                  <img
                    src={templateData.stampUrl}
                    alt="Штамп организации"
                    className="max-w-[120px] object-contain border border-gray-200 rounded shadow"
                  />
                  <span className="text-xs text-gray-500 mt-2">Штамп организации</span>
                </div>
              )}
            </CardContent>
          </Card>
          {placeholders.length > 0 && (
            <Card className="bg-white/60 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle>Поля шаблона</CardTitle>
                <p className="text-sm text-gray-600">{placeholders.length} заполняемых полей обнаружено</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {placeholders.map((placeholder) => (
                      <div key={placeholder.id} className="flex items-center justify-between p-2 bg-white/40 rounded-md space-x-2">
                        <Input
                          value={placeholder.label}
                          onChange={(e) => {
                            const newLabel = e.target.value;
                            setPlaceholders((prev) =>
                              prev.map((p) => (p.id === placeholder.id ? { ...p, label: newLabel } : p))
                            );
                          }}
                          className="flex-1 text-xs"
                        />
                        <Badge variant="outline" className="text-xs select-none">
                          {placeholder.placeholder}
                        </Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        <div className="lg:col-span-2">
          <Card className="bg-white/60 backdrop-blur-sm border-white/20 h-[calc(100vh-200px)] flex flex-col overflow-auto">
            <CardHeader>
              <CardTitle>Содержимое шаблона</CardTitle>
              <p className="text-sm text-gray-600">Напишите содержимое документа и вставьте плейсхолдеры</p>
            </CardHeader>
            <CardContent className="flex-1">
              <Editor
                editorState={editorState}
                onEditorStateChange={setEditorState}
                wrapperClassName="wrapper-class"
                editorClassName="rdw-editor-main"
                toolbarClassName="toolbar-class"
                blockRendererFn={blockRendererFn}
                toolbar={{
                  options: ['inline', 'blockType', 'fontSize', 'list', 'textAlign', 'link', 'history', 'image'],
                  image: {
                    urlEnabled: true,
                    uploadEnabled: false,
                    previewImage: true,
                    alt: { present: true, mandatory: false },
                  },
                }}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </div>
  );
};

export default TemplateCreator;
