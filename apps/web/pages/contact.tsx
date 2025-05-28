import Head from 'next/head';
import { useState } from 'react';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState({
    success: false,
    message: '',
  });
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // In a real application, this would send the data to an API endpoint
    // For now, we'll just simulate a successful submission
    setTimeout(() => {
      setSubmitStatus({
        success: true,
        message: 'Your message has been sent. We\'ll get back to you shortly.',
      });
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
      });
      setIsSubmitting(false);
    }, 1500);
  };
  
  return (
    <>
      <Head>
        <title>Contact Us | Men's Health Finder</title>
        <meta name="description" content="Get in touch with Men's Health Finder for questions, partnerships, or support" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <main>
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl md:text-5xl font-bold mb-8">Contact Us</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div>
                <p className="text-xl text-textSecondary mb-8">
                  Have questions or feedback? We'd love to hear from you. Fill out the form below 
                  and our team will get back to you as soon as possible.
                </p>
                
                <div className="space-y-6 mt-8">
                  <div className="flex items-start space-x-4">
                    <div className="text-primary">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold">Email</h3>
                      <p className="text-textSecondary">contact@menshealthfinder.com</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="text-primary">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold">Phone</h3>
                      <p className="text-textSecondary">(555) 123-4567</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="text-primary">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold">Address</h3>
                      <p className="text-textSecondary">123 Health Street, Austin, TX 78701</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <form onSubmit={handleSubmit} className="bg-gray-900 rounded-xl p-6 shadow-lg">
                  {submitStatus.success && (
                    <div className="bg-green-900/50 text-green-200 p-4 rounded-lg mb-6">
                      {submitStatus.message}
                    </div>
                  )}
                  
                  <div className="mb-4">
                    <label htmlFor="name" className="block text-textSecondary mb-2">Name</label>
                    <input 
                      type="text" 
                      id="name"
                      name="name"
                      className="input" 
                      placeholder="Your name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="email" className="block text-textSecondary mb-2">Email</label>
                    <input 
                      type="email" 
                      id="email"
                      name="email"
                      className="input" 
                      placeholder="Your email address"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="subject" className="block text-textSecondary mb-2">Subject</label>
                    <input 
                      type="text" 
                      id="subject"
                      name="subject"
                      className="input" 
                      placeholder="Subject of your message"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
                  <div className="mb-6">
                    <label htmlFor="message" className="block text-textSecondary mb-2">Message</label>
                    <textarea 
                      id="message"
                      name="message"
                      className="input min-h-[150px]" 
                      placeholder="Your message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
                  <button 
                    type="submit" 
                    className="btn w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default Contact;
