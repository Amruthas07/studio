
export const subjectsByDepartment = {
  cs: {
    1: ["DSA", "Maths I", "Digital Logic", "C Programming"],
    2: ["OOP", "Maths II", "Data Structures", "Web Tech"],
    3: ["Algorithms", "OS", "DBMS", "Compiler Design"],
    4: ["Computer Networks", "AI", "Software Engg.", "Microprocessors"],
    5: ["Cloud Computing", "ML", "Cryptography", "Distributed Systems"],
    6: ["Big Data", "Mobile Computing", "Cyber Security", "Project I"],
    7: ["Advanced AI", "IoT", "NLP", "Project II"],
    8: ["Research", "Internship", "Ethics", "Project III"],
  },
  ce: {
    1: ["Engg. Mechanics", "Maths I", "Surveying I", "Geology"],
    2: ["Solid Mechanics", "Maths II", "Surveying II", "Fluid Mechanics"],
    3: ["Structural Analysis", "Concrete Tech", "Geotech Engg.", "Transportation"],
    4: ["Steel Structures", "Hydrology", "Environmental Engg.", "Estimating"],
    5: ["Advanced Structures", "Foundation Engg.", "Water Resources", "Project I"],
    6: ["Construction Mgmt", "Prestressed Concrete", "Earthquake Engg.", "Project II"],
    7: ["Advanced Geotech", "Bridge Engg.", "Urban Planning", "Project III"],
    8: ["Research", "Internship", "Professional Practice", "Project IV"],
  },
  me: {
    1: ["Thermodynamics", "Maths I", "Engg. Drawing", "Workshop Tech"],
    2: ["Fluid Mechanics", "Maths II", "Mechanics of Machines", "Material Science"],
    3: ["Heat Transfer", "Machine Design I", "Manufacturing", "Dynamics"],
    4: ["IC Engines", "Machine Design II", "Robotics", "Control Systems"],
    5: ["FEA", "Mechatronics", "Power Plant Engg.", "Project I"],
    6: ["Automobile Engg.", "CAD/CAM", "Industrial Engg.", "Project II"],
    7: ["CFD", "Advanced Mechanics", "Tribology", "Project III"],
    8: ["Research", "Internship", "Ethics", "Project IV"],
  },
  ee: {
    1: ["Basic Electrical", "Maths I", "Physics", "Chemistry"],
    2: ["Circuit Theory", "Maths II", "Digital Electronics", "EMF Theory"],
    3: ["Power Systems I", "Control Systems", "Electrical Machines", "Measurements"],
    4: ["Power Systems II", "Microprocessors", "Power Electronics", "Signals"],
    5: ["Advanced Machines", "High Voltage Engg.", "DSP", "Project I"],
    6: ["Switchgear", "PLC & SCADA", "Renewable Energy", "Project II"],
    7: ["Smart Grids", "EHVAC", "FACTS", "Project III"],
    8: ["Research", "Internship", "Economics", "Project IV"],
  },
  mce: {
    1: ["Intro to Mechatronics", "Maths I", "Engg. Mechanics", "Programming"],
    2: ["Sensors & Actuators", "Maths II", "Digital Logic", "Circuits"],
    3: ["Control Systems", "Microcontrollers", "Robotics", "Hydraulics"],
    4: ["Industrial Automation", "AI in Mechatronics", "Embedded Systems", "Vision Systems"],
    5: ["PLC Programming", "Advanced Robotics", "Digital Manufacturing", "Project I"],
    6: ["IoT for Mechatronics", "Autonomous Systems", "HMI", "Project II"],
    7: ["Advanced Control", "Machine Learning", "Bio-Mechatronics", "Project III"],
    8: ["Research", "Internship", "Ethics", "Project IV"],
  },
  ec: {
    1: ["Basic Electronics", "Maths I", "Physics", "Network Theory"],
    2: ["Analog Electronics", "Maths II", "Digital Systems", "Signals & Systems"],
    3: ["Communication I", "Microprocessors", "Antennas", "Control Systems"],
    4: ["Communication II", "VLSI Design", "Microwave Engg.", "Info. Theory"],
    5: ["Wireless Comm.", "Embedded Systems", "DSP", "Project I"],
    6: ["Optical Comm.", "Satellite Comm.", "Image Processing", "Project II"],
    7: ["5G Technology", "IoT & Wireless Sensors", "AI for Comm.", "Project III"],
    8: ["Research", "Internship", "Ethics", "Project IV"],
  },
};

export type Department = keyof typeof subjectsByDepartment;
export type Semester = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export const getSubjects = (department: Department, semester: Semester): string[] => {
    const dept = subjectsByDepartment[department];
    if (dept && (dept as any)[semester]) {
        return (dept as any)[semester];
    }
    // Return a default set of subjects if not found to avoid errors
    return ['Subject 1', 'Subject 2', 'Subject 3', 'Subject 4'];
}
