// src/pages/AboutUs.jsx
import { useState, useEffect, useRef } from 'react';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Mail,
  Phone,
  Github,
  Linkedin,
  MapPin,
  Code2,
  Database,
  Globe,
  Server,
  Smartphone,
  Palette,
  ArrowRight,
  ExternalLink,
  Download,
  Sparkles,
  Zap,
  Target,
  Users,
  Coffee,
  Heart,
  CheckCircle2,
  Star,
  MessageCircle,
} from 'lucide-react';
import { cn } from '../lib/utils';
import Button from '../components/common/Button';

// Animated Background Pattern Component
const AnimatedBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Gradient Orbs */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-purple-500/20 rounded-full blur-3xl"
      />
      <motion.div
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-emerald-400/20 to-cyan-500/20 rounded-full blur-3xl"
      />
      
      {/* Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(38, 50, 59, 0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(38, 50, 59, 0.5) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />
      
      {/* Floating Particles */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-[#26323B]/20 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

// Animated Counter Component
const AnimatedCounter = ({ end, duration = 2, suffix = '' }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) {
      let startTime;
      const animate = (currentTime) => {
        if (!startTime) startTime = currentTime;
        const progress = Math.min((currentTime - startTime) / (duration * 1000), 1);
        setCount(Math.floor(progress * end));
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      requestAnimationFrame(animate);
    }
  }, [isInView, end, duration]);

  return <span ref={ref}>{count}{suffix}</span>;
};

// Skill Card Component
const SkillCard = ({ icon: Icon, title, skills, delay, color }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay }}
      whileHover={{ y: -8, scale: 1.02 }}
      className="group relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 overflow-hidden"
    >
      {/* Background Gradient on Hover */}
      <div className={cn(
        "absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-500",
        color
      )} />
      
      {/* Icon Container */}
      <motion.div
        whileHover={{ rotate: 360 }}
        transition={{ duration: 0.6 }}
        className={cn(
          "w-14 h-14 rounded-xl flex items-center justify-center mb-4",
          color
        )}
      >
        <Icon className="w-7 h-7 text-white" />
      </motion.div>
      
      <h3 className="text-xl font-bold text-[#26323B] mb-3 group-hover:text-[#455A64] transition-colors">
        {title}
      </h3>
      
      <div className="flex flex-wrap gap-2">
        {skills.map((skill, index) => (
          <motion.span
            key={skill}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.3, delay: delay + index * 0.1 }}
            className="px-3 py-1.5 bg-gray-100 text-[#455A64] text-sm rounded-full hover:bg-[#26323B] hover:text-white transition-all duration-300 cursor-default"
          >
            {skill}
          </motion.span>
        ))}
      </div>
    </motion.div>
  );
};

// Timeline Item Component
const TimelineItem = ({ year, title, description, delay, isLeft }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: isLeft ? -50 : 50 }}
      animate={isInView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.6, delay }}
      className={cn(
        "relative flex items-center gap-8",
        isLeft ? "flex-row" : "flex-row-reverse"
      )}
    >
      <div className={cn(
        "flex-1",
        isLeft ? "text-right" : "text-left"
      )}>
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="inline-block bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <span className="inline-block px-3 py-1 bg-[#26323B] text-white text-sm font-medium rounded-full mb-3">
            {year}
          </span>
          <h4 className="text-lg font-bold text-[#26323B] mb-2">{title}</h4>
          <p className="text-[#455A64]">{description}</p>
        </motion.div>
      </div>
      
      {/* Center Dot */}
      <motion.div
        initial={{ scale: 0 }}
        animate={isInView ? { scale: 1 } : {}}
        transition={{ duration: 0.4, delay: delay + 0.2 }}
        className="w-4 h-4 bg-[#26323B] rounded-full relative z-10 flex-shrink-0"
      >
        <motion.div
          animate={{ scale: [1, 1.5, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 bg-[#26323B]/30 rounded-full"
        />
      </motion.div>
      
      <div className="flex-1" />
    </motion.div>
  );
};

// Contact Card Component
const ContactCard = ({ icon: Icon, label, value, href, delay }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  const content = (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -5, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="group flex items-center gap-4 p-5 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 cursor-pointer"
    >
      <motion.div
        whileHover={{ rotate: 15 }}
        className="w-12 h-12 bg-gradient-to-br from-[#26323B] to-[#455A64] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
      >
        <Icon className="w-6 h-6 text-white" />
      </motion.div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-[#B0BEC5] font-medium">{label}</p>
        <p className="text-[#26323B] font-semibold truncate group-hover:text-[#455A64] transition-colors">
          {value}
        </p>
      </div>
      <ExternalLink className="w-5 h-5 text-[#B0BEC5] group-hover:text-[#26323B] transition-colors" />
    </motion.div>
  );

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="block">
        {content}
      </a>
    );
  }

  return content;
};

// Main About Us Component
export default function AboutUs() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });
  
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -100]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  const skills = [
    {
      icon: Globe,
      title: "Frontend Development",
      skills: ["React.js", "Next.js", "TypeScript", "Tailwind CSS", "Framer Motion"],
      color: "bg-gradient-to-br from-blue-500 to-cyan-500",
    },
    {
      icon: Server,
      title: "Backend Development",
      skills: ["Node.js", "Express.js", "Python", "REST APIs", "GraphQL"],
      color: "bg-gradient-to-br from-emerald-500 to-teal-500",
    },
    {
      icon: Database,
      title: "Database & Cloud",
      skills: ["MongoDB", "PostgreSQL", "Firebase", "AWS", "Appwrite"],
      color: "bg-gradient-to-br from-purple-500 to-pink-500",
    },
    {
      icon: Smartphone,
      title: "Mobile Development",
      skills: ["React Native", "Flutter", "Expo", "Mobile UI/UX"],
      color: "bg-gradient-to-br from-orange-500 to-red-500",
    },
    {
      icon: Palette,
      title: "UI/UX Design",
      skills: ["Figma", "Adobe XD", "Responsive Design", "Prototyping"],
      color: "bg-gradient-to-br from-pink-500 to-rose-500",
    },
    {
      icon: Code2,
      title: "Tools & Others",
      skills: ["Git", "Docker", "Linux", "Agile/Scrum", "CI/CD"],
      color: "bg-gradient-to-br from-indigo-500 to-violet-500",
    },
  ];

  const stats = [
    { value: 7, suffix: "+", label: "Projects Completed", icon: CheckCircle2 },
    { value: 1, suffix: "+", label: "Years Experience", icon: Star },
    { value: 5, suffix: "+", label: "Happy Clients", icon: Users },
    { value: 1000, suffix: "+", label: "Cups of Coffee", icon: Coffee },
  ];

  const journeyItems = [
    {
      year: "2022",
      title: "Started Coding Journey",
      description: "Began learning web development fundamentals, HTML, CSS, and JavaScript."
    },
    {
      year: "2023",
      title: "Full Stack Development",
      description: "Expanded skills to include React, Node.js, and database management."
    },
    {
      year: "2024",
      title: "Professional Experience",
      description: "Started working on real-world projects and contributing to open source."
    },
    {
      year: "Present",
      title: "Continuous Growth",
      description: "Building innovative solutions and expanding expertise in modern technologies."
    },
  ];

  return (
    <div ref={containerRef} className="min-h-screen bg-gradient-to-b from-[#F7F7F7] to-white">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <AnimatedBackground />
        
        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="container mx-auto px-4 py-20 relative z-10"
        >
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left Content */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#26323B]/5 rounded-full mb-6"
                >
                  <Sparkles className="w-4 h-4 text-[#26323B]" />
                  <span className="text-sm font-medium text-[#26323B]">Available for Hire</span>
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#26323B] mb-4"
                >
                  Hi, I'm{' '}
                  <span className="relative">
                    <span className="relative z-10 bg-gradient-to-r from-[#26323B] via-[#455A64] to-[#26323B] bg-clip-text text-transparent">
                      Kashif Shumail
                    </span>
                    <motion.span
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ delay: 0.8, duration: 0.6 }}
                      className="absolute bottom-2 left-0 h-3 bg-gradient-to-r from-cyan-300/40 to-blue-400/40 -z-0"
                    />
                  </span>
                </motion.h1>

                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-xl md:text-2xl text-[#455A64] mb-6"
                >
                  Junior Full Stack Software Engineer
                </motion.h2>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-lg text-[#455A64] leading-relaxed mb-8"
                >
                  A passionate and dedicated developer with a keen eye for creating 
                  elegant, scalable, and user-centric web applications. I specialize 
                  in building modern full-stack solutions that bridge the gap between 
                  innovative design and robust functionality. Currently focused on 
                  crafting exceptional digital experiences using cutting-edge technologies.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="flex flex-wrap gap-4"
                >
                  <motion.a
                    href="mailto:kashifshumail1229@gmail.com"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#26323B] text-white rounded-xl font-semibold hover:bg-[#455A64] transition-colors shadow-lg hover:shadow-xl"
                  >
                    <Mail className="w-5 h-5" />
                    Get In Touch
                  </motion.a>
                  <motion.a
                    href="https://www.github.com/kashi1229"
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#26323B] rounded-xl font-semibold border-2 border-[#26323B] hover:bg-[#26323B] hover:text-white transition-all shadow-lg hover:shadow-xl"
                  >
                    <Github className="w-5 h-5" />
                    View GitHub
                  </motion.a>
                </motion.div>
              </motion.div>

              {/* Right Content - Profile Image */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
                className="relative flex justify-center"
              >
                <div className="relative">
                  {/* Animated Rings */}
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 rounded-full border-2 border-dashed border-[#26323B]/20"
                    style={{ transform: "scale(1.2)" }}
                  />
                  <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 rounded-full border-2 border-dashed border-[#455A64]/15"
                    style={{ transform: "scale(1.4)" }}
                  />
                  
                  {/* Profile Image Container */}
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="relative w-72 h-72 md:w-80 md:h-80 rounded-full overflow-hidden shadow-2xl border-4 border-white"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-[#26323B] to-[#455A64] flex items-center justify-center">
                      <span className="text-8xl font-bold text-white/90">KS</span>
                    </div>
                    
                    {/* Floating Tech Icons */}
                    {[Code2, Database, Globe, Server].map((Icon, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1 + index * 0.1 }}
                        className="absolute"
                        style={{
                          top: `${20 + Math.sin(index * 1.5) * 30}%`,
                          left: `${20 + Math.cos(index * 1.5) * 30}%`,
                        }}
                      >
                        <motion.div
                          animate={{
                            y: [0, -10, 0],
                          }}
                          transition={{
                            duration: 2 + index * 0.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                          className="w-10 h-10 bg-white rounded-lg shadow-lg flex items-center justify-center"
                        >
                          <Icon className="w-5 h-5 text-[#26323B]" />
                        </motion.div>
                      </motion.div>
                    ))}
                  </motion.div>

                  {/* Status Badge */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8 }}
                    className="absolute -bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-green-500 text-white rounded-full text-sm font-medium shadow-lg flex items-center gap-2"
                  >
                    <motion.span
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="w-2 h-2 bg-white rounded-full"
                    />
                    Available for Work
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-6 h-10 border-2 border-[#26323B]/30 rounded-full flex justify-center"
          >
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1.5 h-3 bg-[#26323B]/50 rounded-full mt-2"
            />
          </motion.div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-[#26323B]">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="w-16 h-16 mx-auto mb-4 bg-white/10 rounded-2xl flex items-center justify-center"
                >
                  <stat.icon className="w-8 h-8 text-white" />
                </motion.div>
                <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                  <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                </div>
                <p className="text-white/70 font-medium">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About Me Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-2 bg-[#26323B]/5 rounded-full text-[#26323B] font-medium mb-4">
              About Me
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-[#26323B] mb-4">
              Crafting Digital Excellence
            </h2>
            <p className="text-[#455A64] max-w-2xl mx-auto">
              My journey in software development is driven by curiosity and a relentless 
              pursuit of creating impactful solutions.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#26323B] mb-2">My Mission</h3>
                    <p className="text-[#455A64]">
                      To create innovative software solutions that solve real-world problems 
                      while delivering exceptional user experiences that make a difference.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#26323B] mb-2">My Approach</h3>
                    <p className="text-[#455A64]">
                      I believe in writing clean, maintainable code while staying up-to-date 
                      with the latest technologies and best practices in the industry.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Heart className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#26323B] mb-2">My Passion</h3>
                    <p className="text-[#455A64]">
                      Beyond coding, I'm passionate about mentoring aspiring developers, 
                      contributing to open source, and continuous learning.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="bg-gradient-to-br from-[#26323B] to-[#455A64] rounded-3xl p-8 text-white">
                <h3 className="text-2xl font-bold mb-6">Quick Facts</h3>
                <div className="space-y-4">
                  {[
                    { label: "Name", value: "Kashif Shumail" },
                    { label: "Role", value: "Full Stack Developer" },
                    { label: "Experience", value: "2+ Years" },
                    { label: "Location", value: "Pakistan" },
                    { label: "Languages", value: "English, Urdu" },
                  ].map((fact, index) => (
                    <motion.div
                      key={fact.label}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                      className="flex justify-between items-center py-3 border-b border-white/10 last:border-0"
                    >
                      <span className="text-white/70">{fact.label}</span>
                      <span className="font-semibold">{fact.value}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Skills Section */}
      <section className="py-20 bg-[#F7F7F7]">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-2 bg-[#26323B]/5 rounded-full text-[#26323B] font-medium mb-4">
              Technical Skills
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-[#26323B] mb-4">
              My Tech Stack
            </h2>
            <p className="text-[#455A64] max-w-2xl mx-auto">
              I work with a diverse range of modern technologies to build 
              scalable and performant applications.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {skills.map((skill, index) => (
              <SkillCard
                key={skill.title}
                {...skill}
                delay={index * 0.1}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Journey Timeline */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-2 bg-[#26323B]/5 rounded-full text-[#26323B] font-medium mb-4">
              My Journey
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-[#26323B] mb-4">
              Career Timeline
            </h2>
          </motion.div>

          <div className="max-w-4xl mx-auto relative">
            {/* Vertical Line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#26323B] to-[#455A64]/30" />
            
            <div className="space-y-12">
              {journeyItems.map((item, index) => (
                <TimelineItem
                  key={item.year}
                  {...item}
                  delay={index * 0.2}
                  isLeft={index % 2 === 0}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 bg-gradient-to-b from-[#F7F7F7] to-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-2 bg-[#26323B]/5 rounded-full text-[#26323B] font-medium mb-4">
              Get In Touch
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-[#26323B] mb-4">
              Let's Work Together
            </h2>
            <p className="text-[#455A64] max-w-2xl mx-auto">
              I'm always open to discussing new projects, creative ideas, 
              or opportunities to be part of your visions.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            <ContactCard
              icon={Mail}
              label="Email"
              value="kashifshumail1229@gmail.com"
              href="mailto:kashifshumail1229@gmail.com"
              delay={0}
            />
            <ContactCard
              icon={MessageCircle}
              label="WhatsApp"
              value="+923104738798"
              href="https://wa.me/923104738798"
              delay={0.1}
            />
            <ContactCard
              icon={Github}
              label="GitHub"
              value="kashi1229"
              href="https://www.github.com/kashi1229"
              delay={0.2}
            />
            <ContactCard
              icon={Linkedin}
              label="LinkedIn"
              value="Kashif Shumail"
              href="https://www.linkedin.com/in/kashif-shumail-7654b5364"
              delay={0.3}
            />
          </div>

          {/* CTA Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-16 max-w-4xl mx-auto"
          >
            <div className="relative bg-gradient-to-r from-[#26323B] to-[#455A64] rounded-3xl p-8 md:p-12 overflow-hidden">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div 
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
                    backgroundSize: '32px 32px',
                  }}
                />
              </div>

              <div className="relative z-10 text-center">
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
                  Ready to Start a Project?
                </h3>
                <p className="text-white/80 mb-8 max-w-xl mx-auto">
                  Whether you have a project in mind or just want to chat about 
                  possibilities, I'd love to hear from you.
                </p>
                <motion.a
                  href="mailto:kashifshumail1229@gmail.com"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white text-[#26323B] rounded-xl font-semibold hover:bg-[#F7F7F7] transition-colors shadow-lg"
                >
                  <Mail className="w-5 h-5" />
                  Send Me a Message
                  <ArrowRight className="w-5 h-5" />
                </motion.a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer Credits */}
      <section className="py-8 border-t border-gray-100">
        <div className="container mx-auto px-4 text-center">
          <p className="text-[#455A64]">
            Designed & Built with{' '}
            <motion.span
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="inline-block text-red-500"
            >
              ❤️
            </motion.span>{' '}
            by Kashif Shumail
          </p>
        </div>
      </section>
    </div>
  );
}