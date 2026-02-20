import { useState } from 'react';
import { HelpCircle, X, Phone, Mail, MessageCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';

export default function HelpButton() {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <>
      {/* Floating Help Button */}
      <button
        onClick={() => setShowHelp(true)}
        className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110"
        aria-label="Get Help"
      >
        <HelpCircle className="w-6 h-6" />
      </button>

      {/* Help Panel */}
      {showHelp && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4">
          <Card className="w-full max-w-md bg-white rounded-t-2xl md:rounded-2xl shadow-2xl animate-in slide-in-from-bottom md:slide-in-from-bottom-0">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <HelpCircle className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Need Help?</h3>
                    <p className="text-sm text-gray-500">We're here to assist you</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowHelp(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                {/* Quick Help Topics */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Quick Help Topics</h4>
                  <div className="space-y-2">
                    <button className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-sm">
                      📝 How to add a student
                    </button>
                    <button className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-sm">
                      👥 How to add staff members
                    </button>
                    <button className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-sm">
                      📦 How to submit a batch order
                    </button>
                    <button className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-sm">
                      📸 Photo requirements & tips
                    </button>
                  </div>
                </div>

                {/* Contact Options */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Contact Support</h4>
                  <div className="space-y-2">
                    <a
                      href="tel:+918837427391"
                      className="flex items-center gap-3 px-4 py-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                    >
                      <Phone className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-green-900">Call Us</p>
                        <p className="text-xs text-green-700">+91 88374 27391</p>
                      </div>
                    </a>

                    <a
                      href="mailto:support@samiulgraphics.com"
                      className="flex items-center gap-3 px-4 py-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                    >
                      <Mail className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-blue-900">Email Us</p>
                        <p className="text-xs text-blue-700">support@samiulgraphics.com</p>
                      </div>
                    </a>

                    <a
                      href="https://wa.me/918837427391"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 px-4 py-3 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                    >
                      <MessageCircle className="w-5 h-5 text-emerald-600" />
                      <div>
                        <p className="text-sm font-medium text-emerald-900">WhatsApp</p>
                        <p className="text-xs text-emerald-700">Chat with us instantly</p>
                      </div>
                    </a>
                  </div>
                </div>

                {/* Business Hours */}
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600">
                    <span className="font-medium">Business Hours:</span> Mon-Sat, 9:00 AM - 6:00 PM
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
