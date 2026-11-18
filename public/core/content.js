export const PERSONALITIES = [
  { id: 'miso', name: 'Miso', title: 'Professional overthinker', color: '#f2cda3', pattern: 'freckles', job: 'intern', description: 'Has prepared a 30-page plan for doing absolutely nothing.', lines: { pet: 'I have added this touch to the meeting minutes.', feed: 'Is this snack billable?', comfort: 'Could this blanket have been an email?', play: 'I scheduled spontaneity for next Thursday.' } },
  { id: 'moss', name: 'Moss', title: 'Socially terrifying · 社恐', color: '#bcd6ad', pattern: 'spots', job: 'gardener', description: 'Not afraid of people. People are afraid of the group chat.', lines: { pet: 'We are best friends now. I invited 43 more.', feed: 'A snack? I thought you said a networking event.', comfort: 'A group hug. With the entire neighbourhood.', play: 'The plant is now in our group chat.' } },
  { id: 'pip', name: 'Pip', title: 'Extremely conservative', color: '#c9b8df', pattern: 'stripes', job: 'chef', description: 'Thinks every wild idea is not nearly wild enough.', lines: { pet: 'One pat? A very conservative proposal.', feed: 'Needs more drama. And possibly a tiny volcano.', comfort: 'A blanket fort? I was thinking blanket kingdom.', play: 'Why juggle one leaf when we could juggle the garden?' } }
];
export const PATTERNS = ['freckles', 'spots', 'stripes'];
export const JOBS = ['none', 'intern', 'gardener', 'chef'];

// Add a line per personality here. These records are data, never executable mods.
export const OBJECTS = [
  { id:'cushion', name:'Cloud cushion', icon:'☁', verb:'Take a little nap', x:21, y:64, effect:'rest', lines:{miso:'I have set my out-of-office reply to zzz.',moss:'A nap party. Attendance is compulsory. Sleeping is optional.',pip:'A small nap? I propose a full hibernation.'}},
  { id:'plant', name:'Tiny garden', icon:'♧', verb:'Visit the plant', x:74, y:43, effect:'play', lines:{miso:'I made a growth spreadsheet. The plant declined to comment.',moss:'The plant has been added to the group chat.',pip:'One leaf? We should be growing a jungle.'}},
  { id:'snack', name:'Snack bowl', icon:'◒', verb:'Share a snack', x:51, y:75, effect:'feed', lines:{miso:'Snack approved. Crumbs filed under miscellaneous.',moss:'I brought snacks for everyone. Including the furniture.',pip:'This is a very cautious amount of pudding.'}},
  { id:'notebook', name:'Very important notebook', icon:'▤', verb:'Make a tiny plan', x:36, y:43, effect:'focus', lines:{miso:'Page one: do nothing. Pages two through thirty: contingency plans.',moss:'I wrote everyone a welcome letter. Even the eraser.',pip:'Step one: take over the windowsill. Step two: snack.'}},
  { id:'bell', name:'Friendship bell', icon:'♧', verb:'Call a little gathering', x:84, y:72, effect:'gather', lines:{miso:'This meeting could have been a nap.',moss:'Just a small gathering. Of everyone I have ever met.',pip:'A tea party? I ordered a parade.'}}
];
export const AMBIENT_LINES = {
  miso:['Miso has scheduled a five-minute break from scheduling breaks.','Miso checks the plant for unread messages.'],
  moss:['Moss waves at a dust particle. A friendship begins.','Moss introduces the cushion to the snack bowl.'],
  pip:['Pip considers turning the windowsill into a tiny kingdom.','Pip believes the clouds are not nearly fluffy enough.']
};
