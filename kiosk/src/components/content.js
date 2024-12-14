import React, { useRef, useEffect, useState } from 'react';
import '../styles/content.css';
import { images } from '../constant/images';
import MainPage from './MainPage';
import Burgers from './Burgers';
import Drinks from './Drinks';
import Sides from './Sides';
import Breakfasts from './Breakfasts';
import Header from './header';
import Cart from './cart'; 

const Content = () => {
    const [cart, setCart] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false); // State to control cart visibility

    const slides = [
        { src: images.nuggets, text: '$1 Crispy Nuggets' },
        { src: images.stackerKing, text: 'The Stacker King' },
        { src: images.salad, text: 'Salads' },
        { src: images.mon, text: 'Breakfast' },
        { src: images.chipss, text: 'More Fries' },
        { src: images.chip, text: 'Fries' },
    ];

    const carouselRef = useRef(null);

    useEffect(() => {
        const interval = setInterval(() => {
            if (carouselRef.current) {
                carouselRef.current.scrollLeft += carouselRef.current.offsetWidth;
                if (carouselRef.current.scrollLeft >= (carouselRef.current.scrollWidth - carouselRef.current.offsetWidth)) {
                    carouselRef.current.scrollLeft = 0;
                }
            }
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    const scrollToSection = (sectionId) => {
        const section = document.getElementById(sectionId);
        if (section) {
            section.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const addToCart = (item) => {
        setCart((prevCart) => [...prevCart, item]);
        alert(`${item.name} has been added to your cart!`);
    };

    const toggleCart = () => {
        setIsCartOpen(!isCartOpen);
    };

    return (
        <div>
            <Header setSelectedCategory={scrollToSection} />
            <button className="cart-button" onClick={toggleCart}>View Cart ({cart.length})</button> {/* Cart Button */}

            {isCartOpen && <Cart cart={cart} onClose={toggleCart} />} {/* Show Cart when open */}

            <main className="content">
                <section className="kiosk-promo">
                    <div className="promo-overlay">
                        <p className="promo">20% off today</p>
                    </div>
                    <img src={images.promopp} alt="Milkshake Promo" className="imagePromo" />
                    <div className="textPromo">
                        <p className="slogan">Why not grab a </p>
                        <p className="slogan">milkshake and cool off.</p>
                        <button className="promo-button">View milkshakes</button>
                    </div>
                </section>

                <section className="kiosk-featured">
                    <h2>Featured:</h2>
                    <div className='carousel' ref={carouselRef}>
                        {slides.map((slide, index) => (
                            <div key={index} className='featured-item'>
                                <img src={slide.src} alt={slide.text} />
                                <p className='overlay'>{slide.text}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section id="MainPage" className='main-contents'>
                    <MainPage addToCart={addToCart} /> {/* Pass addToCart function */}
                </section>
                <section id="Burgers" className='main-contents'>
                    <Burgers addToCart={addToCart} /> {/* Pass addToCart function */}
                </section>
                <section id="Sides" className='main-contents'>
                    <Sides addToCart={addToCart} /> {/* Pass addToCart function */}
                </section>
                <section id="Breakfasts" className='main-contents'>
                    <Breakfasts addToCart={addToCart} /> {/* Pass addToCart function */}
                </section>
                <section id="Drinks" className='main-contents'>
                    <Drinks addToCart={addToCart} /> {/* Pass addToCart function */}
                </section>
            </main>
        </div>
    );
};

export default Content;
