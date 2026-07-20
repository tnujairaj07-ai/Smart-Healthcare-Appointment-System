import React, { useState, useEffect } from 'react';

const DocPatientRecords = ({ appointments }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [patientData, setPatientData] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // File upload simulation/actual state
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState('');

  // Extract patients assigned to doctor
  const patientList = [];
  const seenIds = new Set();
  appointments.forEach(a => {
    if (a.patient && !seenIds.has(a.patient.id)) {
      seenIds.add(a.patient.id);
      patientList.push(a.patient);
    }
  });

  const filteredPatients = patientList.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.chronic && p.chronic.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const fetchPatientDetails = (id) => {
    setLoading(true);
    setSelectedPatientId(id);
    setUploadSuccess('');
    
    const token = localStorage.getItem('token');
    fetch(`/api/doctor/patients/${id}/records`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to load patient health chart.');
        return res.json();
      })
      .then(data => {
        setPatientData(data);
        setLoading(false);
      })
      .catch(err => {
        alert(err.message);
        setLoading(false);
        setSelectedPatientId(null);
      });
  };

  const handleFileUpload = (e) => {
    e.preventDefault();
    if (!uploadFile) return;

    setUploading(true);
    setUploadSuccess('');
    const token = localStorage.getItem('token');

    // To support front-end simulation easily if no physical file selected, we allow name-based post
    const formData = new FormData();
    formData.append('file', uploadFile);

    fetch(`/api/doctor/patients/${selectedPatientId}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    })
      .then(res => {
        if (!res.ok) throw new Error('File upload failed.');
        return res.json();
      })
      .then(data => {
        setUploading(false);
        setUploadSuccess(`Uploaded: ${data.fileName}`);
        setUploadFile(null);
        // Refresh records details
        fetchPatientDetails(selectedPatientId);
      })
      .catch(err => {
        // Fallback simulation for offline testing
        fetch(`/api/doctor/patients/${selectedPatientId}/upload`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ filename: uploadFile.name })
        })
          .then(res => res.json())
          .then(data => {
            setUploading(false);
            setUploadSuccess(`Uploaded (Simulated): ${data.fileName}`);
            setUploadFile(null);
            fetchPatientDetails(selectedPatientId);
          })
          .catch(() => {
            setUploading(false);
            alert('Upload failed.');
          });
      });
  };

  return (
    <div className="relative overflow-hidden h-[calc(100vh-140px)]">
      {/* Split layout: Patients list on left, detail view slider overlay on right */}
      <div className="flex h-full gap-5">
        
        {/* Left Side: Scheduled Patients List */}
        <div className="flex-1 flex flex-col dashboard-card bg-white border border-slate-100 rounded-3xl p-6 shadow-sm overflow-hidden text-left space-y-4">
          <div className="flex justify-between items-center flex-wrap gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Patients & Health Records</h3>
              <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Assigned patient roster showing demographics and chronic conditions.</p>
            </div>
            
            {/* Search Input */}
            <div className="relative w-full sm:w-[240px]">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search patient or chronic..."
                className="w-full pl-8 pr-4 py-2 bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 rounded-xl outline-none focus:bg-white focus:border-indigo-400"
              />
              <span className="absolute left-3 top-2.5 text-slate-400 text-[10px]">🔍</span>
            </div>
          </div>

          <div className="flex-grow overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-150 text-[10px] uppercase font-bold text-slate-400">
                  <th className="py-3 px-4">Patient ID</th>
                  <th className="py-3 px-4">Patient Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Chronic Diseases</th>
                  <th className="py-3 px-4">Allergies</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredPatients.length > 0 ? (
                  filteredPatients.map((p) => (
                    <tr 
                      key={p.id}
                      onClick={() => fetchPatientDetails(p.id)}
                      className="hover:bg-slate-50/70 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 font-bold text-slate-400">#PT-{p.id.toString().padStart(3, '0')}</td>
                      <td className="py-3 px-4 text-slate-900 font-bold">{p.name}</td>
                      <td className="py-3 px-4 text-slate-500">{p.email}</td>
                      <td className="py-3 px-4">
                        {p.chronic && p.chronic !== 'None' ? (
                          <span className="bg-amber-50 border border-amber-100 text-amber-700 font-bold px-2.5 py-0.5 rounded text-[10px]">{p.chronic}</span>
                        ) : 'None'}
                      </td>
                      <td className="py-3 px-4">
                        {p.allergies && p.allergies !== 'None' ? (
                          <span className="bg-rose-50 border border-rose-100 text-rose-600 font-bold px-2.5 py-0.5 rounded text-[10px]">{p.allergies}</span>
                        ) : 'None'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button 
                          onClick={(e) => { e.stopPropagation(); fetchPatientDetails(p.id); }}
                          className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-extrabold rounded-lg transition"
                        >
                          Open EHR
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-slate-400 italic">No patients found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Side: Detailed EHR Slider Panel */}
        <div 
          className={`absolute lg:relative right-0 top-0 bottom-0 w-full lg:w-[480px] bg-white border border-slate-150 rounded-3xl shadow-xl p-6 z-30 transform transition-transform duration-300 flex flex-col text-left ${
            selectedPatientId ? 'translate-x-0' : 'translate-x-full lg:translate-x-0 lg:hidden'
          }`}
        >
          {loading ? (
            <div className="flex-1 flex flex-col justify-center items-center space-y-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-650"></div>
              <p className="text-xs text-slate-500 font-bold">Synchronizing EHR data files...</p>
            </div>
          ) : patientData ? (
            <div className="flex flex-col h-full space-y-5 overflow-hidden">
              {/* Header */}
              <div className="flex justify-between items-start border-b border-slate-100 pb-3 flex-shrink-0">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-extrabold text-slate-900">{patientData.profile.name}</h3>
                    <span className="text-[10px] font-bold text-slate-400">#PT-{patientData.profile.id.toString().padStart(3, '0')}</span>
                  </div>
                  <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider">Treating Relationship Active</p>
                </div>
                <button 
                  onClick={() => setSelectedPatientId(null)}
                  className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400"
                >
                  <i className="fa-solid fa-xmark text-sm"></i>
                </button>
              </div>

              {/* Patient records subscroll */}
              <div className="flex-grow overflow-y-auto space-y-5 pr-1">
                {/* Demographics Card */}
                <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl space-y-2">
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Demographics</span>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs font-semibold">
                    <p className="text-slate-500">DOB: <span className="text-slate-800 font-bold">{patientData.profile.dob || 'N/A'}</span></p>
                    <p className="text-slate-500">Phone: <span className="text-slate-800 font-bold">{patientData.profile.phone || 'N/A'}</span></p>
                    <p className="text-slate-500">Address: <span className="text-slate-800 font-bold truncate block max-w-[150px]">{patientData.profile.address || 'N/A'}</span></p>
                    <p className="text-slate-500">Blood Type: <span className="text-indigo-600 font-extrabold">{patientData.profile.bloodType}</span></p>
                  </div>
                </div>

                {/* Anamnesis / Medical background */}
                <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl space-y-2">
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Genetic Anamnesis</span>
                  <div className="space-y-1.5 text-xs font-semibold">
                    <p className="text-slate-500">Allergies: <span className="text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded font-bold border border-rose-100">{patientData.profile.allergies}</span></p>
                    <p className="text-slate-500">Chronic Diseases: <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-bold border border-amber-100">{patientData.profile.chronic}</span></p>
                    <p className="text-slate-500">Past Illnesses: <span className="text-slate-800 font-bold">{patientData.profile.pastIllnesses}</span></p>
                  </div>
                </div>

                {/* Visits history */}
                <div className="space-y-2">
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Prescription & Diagnosis History</span>
                  <div className="space-y-2.5 max-h-[160px] overflow-y-auto pr-1">
                    {patientData.history?.length > 0 ? (
                      patientData.history.map(item => (
                        <div key={item.id} className="p-3 bg-white border border-slate-200 rounded-xl space-y-1.5">
                          <div className="flex justify-between items-center text-[10px] font-bold">
                            <span className="text-indigo-650">{item.doctorName}</span>
                            <span className="text-slate-400">{item.date}</span>
                          </div>
                          <p className="text-xs font-bold text-slate-800">Diagnosis: {item.diagnosis}</p>
                          {item.medications?.length > 0 && (
                            <p className="text-[10px] text-slate-500 font-medium">Meds: {item.medications.map(m => `${m.name} (${m.dosage})`).join(', ')}</p>
                          )}
                          {item.notes && <p className="text-[10px] text-slate-400 italic">Notes: "{item.notes}"</p>}
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 italic">No past prescription logs.</p>
                    )}
                  </div>
                </div>

                {/* Laboratory documents upload & List */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Laboratory Reports</span>
                    <span className="text-[8px] bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold px-1.5 py-0.5 rounded uppercase">Verified Labs</span>
                  </div>

                  {/* Direct upload form */}
                  <form onSubmit={handleFileUpload} className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col gap-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Direct verified upload input</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        onChange={(e) => {
                          setUploadFile(e.target.files[0]);
                          setUploadSuccess('');
                        }}
                        className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                      />
                      <button
                        type="submit"
                        disabled={!uploadFile || uploading}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold text-white transition ${
                          uploadFile && !uploading ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-slate-350 cursor-not-allowed'
                        }`}
                      >
                        {uploading ? 'Uploading...' : 'Upload'}
                      </button>
                    </div>
                    {uploadSuccess && <p className="text-[10px] text-emerald-600 font-bold">✓ {uploadSuccess}</p>}
                  </form>

                  <div className="grid grid-cols-1 gap-2 max-h-[140px] overflow-y-auto pr-1">
                    {patientData.reports?.length > 0 ? (
                      patientData.reports.map(file => (
                        <div key={file.id} className="p-2.5 bg-white border border-slate-200 hover:border-indigo-150 rounded-xl flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-xl">📄</span>
                            <div className="text-left min-w-0">
                              <p className="text-xs font-bold text-slate-700 truncate" title={file.fileName}>{file.fileName}</p>
                              <p className="text-[9px] text-slate-450 mt-0.5">{file.uploadDate} · {file.fileType}</p>
                            </div>
                          </div>
                          <a
                            href={`/${file.filePath}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 bg-slate-50 border border-slate-200 text-slate-500 hover:text-indigo-600 rounded-lg transition text-[10px]"
                            title="Download Report"
                          >
                            📥
                          </a>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 italic">No laboratory files uploaded yet.</p>
                    )}
                  </div>
                </div>

                {/* Symptom Checker Query History */}
                <div className="space-y-2">
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Symptom Checker Queries</span>
                  <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1">
                    {patientData.symptomHistory?.length > 0 ? (
                      patientData.symptomHistory.map(chk => (
                        <div key={chk.id} className="p-3 bg-slate-50 border border-slate-150 rounded-xl space-y-1.5 text-xs text-slate-650">
                          <div className="flex justify-between items-center text-[10px] font-bold">
                            <span className="text-slate-800">Symptoms: {chk.symptoms}</span>
                            <span className="text-slate-400">{chk.date}</span>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap text-[10px]">
                            {chk.diagnosedConditions?.map((c, cIdx) => (
                              <span key={cIdx} className="bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold px-1.5 py-0.5 rounded">Diag: {c}</span>
                            ))}
                            <span className={`font-bold px-1.5 py-0.5 rounded ${
                              chk.isUrgent ? 'bg-rose-50 text-rose-700 border border-rose-100' : 'bg-slate-100 text-slate-600'
                            }`}>
                              Severity: {chk.severity}/10
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 italic">No symptom checker logs found.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400 italic">
              Select a patient row from the registry to open their health chart files.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocPatientRecords;
