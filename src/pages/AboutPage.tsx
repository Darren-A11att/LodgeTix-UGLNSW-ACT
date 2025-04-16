import React from 'react';

const AboutPage: React.FC = () => {
  return (
    <div>
      <section className="bg-primary text-white py-16">
        <div className="container-custom">
          <h1 className="text-4xl font-bold mb-6">About The Grand Proclamation</h1>
          <p className="text-xl max-w-3xl">
            Learn about the history, significance, and ceremony of the Grand Proclamation
            for the United Grand Lodge of NSW & ACT.
          </p>
        </div>
      </section>

      <section className="py-12 bg-white">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6 text-primary">A Historic Tradition</h2>
              <p className="text-slate-700 mb-4">
                The Grand Proclamation is a time-honored ceremony that marks the formal Proclamation 
                of the Grand Master and his officers. This ceremonial event has been conducted for centuries 
                and represents one of the most significant occasions in Freemasonry.
              </p>
              <p className="text-slate-700 mb-4">
                Steeped in tradition, the Grand Proclamation ceremony features ancient rituals, symbolism, 
                and protocols that have been preserved throughout Freemasonry's rich history. It serves as 
                a reminder of the organization's commitment to its values and principles.
              </p>
              <p className="text-slate-700">
                For the United Grand Lodge of NSW & ACT, this ceremony represents a transition of leadership 
                and a renewal of our dedication to the principles of Freemasonry: Brotherly Love, Relief, and Truth.
              </p>
            </div>
            <div className="rounded-lg overflow-hidden shadow-lg">
              <img 
                src="https://images.unsplash.com/photo-1568184802072-9c2ee26d1321?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                alt="Historic Masonic Temple" 
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 bg-slate-50">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1 rounded-lg overflow-hidden shadow-lg">
              <img 
                src="https://images.unsplash.com/photo-1577495508326-19a1b3cf65b7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                alt="Grand Lodge Ceremony" 
                className="w-full h-auto"
              />
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-3xl font-bold mb-6 text-primary">The 2025 Grand Proclamation</h2>
              <p className="text-slate-700 mb-4">
                The 2025 Grand Proclamation will be a momentous occasion bringing together Freemasons 
                from across Australia and international visitors from around the world. It will include 
                a series of events over three days, culminating in the formal Proclamation ceremony.
              </p>
              <p className="text-slate-700 mb-4">
                Distinguished guests will include Grand Masters and representatives from other Grand Lodges, 
                civic leaders, and prominent members of the community. The ceremony will showcase the pageantry 
                and dignity that has characterized Freemasonry for generations.
              </p>
              <p className="text-slate-700">
                This Grand Proclamation also marks an important milestone in the history of the United Grand 
                Lodge of NSW & ACT, representing our continued commitment to our members and the community.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 bg-white">
        <div className="container-custom">
          <h2 className="text-3xl font-bold mb-8 text-center text-primary">Frequently Asked Questions</h2>
          <div className="max-w-3xl mx-auto">
            <div className="mb-6">
              <h3 className="text-xl font-bold mb-2">Who can attend the Grand Proclamation?</h3>
              <p className="text-slate-700">
                The Grand Proclamation is open to all Freemasons in good standing. Certain events may be open 
                to partners and guests. Please refer to the specific event details for information on attendance eligibility.
              </p>
            </div>
            <div className="mb-6">
              <h3 className="text-xl font-bold mb-2">What is the dress code?</h3>
              <p className="text-slate-700">
                The main Proclamation ceremony requires formal Masonic regalia appropriate to your rank and jurisdiction. 
                Most social functions will require formal evening wear (black tie). Specific dress requirements for each 
                event will be provided in the event details.
              </p>
            </div>
            <div className="mb-6">
              <h3 className="text-xl font-bold mb-2">Are accommodations provided?</h3>
              <p className="text-slate-700">
                Accommodations are not included in the registration fee. However, we have arranged special rates with 
                several hotels near the Sydney Masonic Centre. Information on these arrangements can be found in the 
                registration section.
              </p>
            </div>
            <div className="mb-6">
              <h3 className="text-xl font-bold mb-2">How do I register for the events?</h3>
              <p className="text-slate-700">
                Registration can be completed online through this website. Simply navigate to the Registration page, 
                select the events you wish to attend, and follow the payment instructions. Early registration is 
                recommended as some events have limited capacity.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;